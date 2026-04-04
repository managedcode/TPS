using ManagedCode.Tps.Internal;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps;

public sealed class TpsPlaybackSession : IDisposable
{
    private readonly Dictionary<string, int> _blockIndexById = new(StringComparer.Ordinal);
    private readonly List<CompiledBlock> _blocks;
    private readonly SynchronizationContext? _eventSynchronizationContext;
    private readonly object _syncRoot = new();
    private readonly Dictionary<string, int> _segmentIndexById = new(StringComparer.Ordinal);
    private readonly int _tickIntervalMs;
    private readonly TimeProvider _timeProvider;
    private bool _disposed;
    private CancellationTokenSource? _playbackCts;
    private int _playbackOffsetMs;
    private long _playbackStartedAtTimestamp;
    private int _speedOffsetWpm;

    public TpsPlaybackSession(CompiledScript script, TpsPlaybackSessionOptions? options = null)
        : this(new TpsPlayer(script), options)
    {
    }

    public TpsPlaybackSession(TpsPlayer player, TpsPlaybackSessionOptions? options = null)
    {
        Player = player;
        var sessionOptions = options ?? new TpsPlaybackSessionOptions();
        _eventSynchronizationContext = sessionOptions.EventSynchronizationContext ?? SynchronizationContext.Current;
        _tickIntervalMs = sessionOptions.TickIntervalMs;
        _timeProvider = sessionOptions.TimeProvider;
        BaseWpm = NormalizeBaseWpm(sessionOptions.BaseWpm ?? TpsSupport.ResolveBaseWpm(player.Script.Metadata));
        SpeedStepWpm = sessionOptions.SpeedStepWpm;
        _speedOffsetWpm = NormalizeSpeedOffset(BaseWpm, sessionOptions.InitialSpeedOffsetWpm ?? 0);
        CurrentState = player.GetState(0);
        _blocks = FlattenBlocks(player.Script).ToList();

        for (var index = 0; index < player.Script.Segments.Count; index++)
        {
            _segmentIndexById[player.Script.Segments[index].Id] = index;
        }

        for (var index = 0; index < _blocks.Count; index++)
        {
            _blockIndexById[_blocks[index].Id] = index;
        }
    }

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? StateChanged;

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? WordChanged;

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? PhraseChanged;

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? BlockChanged;

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? SegmentChanged;

    public event EventHandler<TpsPlaybackStatusChangedEventArgs>? StatusChanged;

    public event EventHandler<TpsPlaybackStateChangedEventArgs>? Completed;

    public event EventHandler<TpsPlaybackSnapshotChangedEventArgs>? SnapshotChanged;

    public event EventHandler<TpsPlaybackListenerExceptionEventArgs>? ListenerException;

    public int BaseWpm { get; }

    public PlayerState CurrentState { get; private set; }

    public int EffectiveBaseWpm => ClampWpm(BaseWpm + _speedOffsetWpm);

    public bool IsPlaying => Status == TpsPlaybackStatus.Playing;

    public TpsPlayer Player { get; }

    public double PlaybackRate => BaseWpm <= 0 ? 1d : EffectiveBaseWpm / (double)BaseWpm;

    public TpsPlaybackSnapshot Snapshot => CreateSnapshot();

    public int SpeedOffsetWpm => _speedOffsetWpm;

    public int SpeedStepWpm { get; }

    public TpsPlaybackStatus Status { get; private set; } = TpsPlaybackStatus.Idle;

    public IDisposable ObserveSnapshot(Action<TpsPlaybackSnapshot> observer, bool emitCurrent = true)
    {
        ThrowIfDisposed();
        ArgumentNullException.ThrowIfNull(observer);

        SnapshotSubscription? subscription = null;
        EventHandler<TpsPlaybackSnapshotChangedEventArgs> handler = (_, args) =>
        {
            if (subscription is { IsDisposed: false })
            {
                observer(args.Snapshot);
            }
        };

        subscription = new SnapshotSubscription(() => SnapshotChanged -= handler);
        SnapshotChanged += handler;

        if (emitCurrent)
        {
            InvokeSnapshotObserver("observeSnapshot", observer, CreateSnapshot(), subscription);
        }

        return subscription;
    }

    public PlayerState Play()
    {
        ThrowIfDisposed();
        Transition? playTransition = null;
        Transition? completedTransition = null;
        CancellationTokenSource? previousLoop = null;
        CancellationTokenSource? nextLoop = null;
        var shouldStartLoop = false;

        lock (_syncRoot)
        {
            if (Status == TpsPlaybackStatus.Playing)
            {
                return CurrentState;
            }

            if (Player.Script.TotalDurationMs == 0)
            {
                completedTransition = UpdatePositionLocked(0, TpsPlaybackStatus.Completed);
            }
            else
            {
                previousLoop = DetachLoopLocked();
                nextLoop = new CancellationTokenSource();
                _playbackCts = nextLoop;
                var startElapsedMs = CurrentState.IsComplete ? 0 : CurrentState.ElapsedMs;
                _playbackOffsetMs = startElapsedMs;
                _playbackStartedAtTimestamp = _timeProvider.GetTimestamp();
                playTransition = UpdatePositionLocked(startElapsedMs, TpsPlaybackStatus.Playing);
                shouldStartLoop = playTransition.Status == TpsPlaybackStatus.Playing;
            }
        }

        previousLoop?.Cancel();
        previousLoop?.Dispose();

        if (completedTransition is not null)
        {
            Publish(completedTransition);
            return completedTransition.State;
        }

        if (!shouldStartLoop)
        {
            nextLoop?.Dispose();
        }

        Publish(playTransition!);
        if (shouldStartLoop)
        {
            _ = RunPlaybackLoopAsync(nextLoop!);
        }

        return playTransition!.State;
    }

    public PlayerState Pause()
    {
        ThrowIfDisposed();
        Transition transition;
        CancellationTokenSource? cancellationTokenSource;

        lock (_syncRoot)
        {
            if (Status != TpsPlaybackStatus.Playing)
            {
                return CurrentState;
            }

            cancellationTokenSource = DetachLoopLocked();
            transition = UpdatePositionLocked(ReadLiveElapsedLocked(), TpsPlaybackStatus.Paused);
        }

        cancellationTokenSource?.Cancel();
        cancellationTokenSource?.Dispose();
        Publish(transition);
        return transition.State;
    }

    public PlayerState Stop()
    {
        ThrowIfDisposed();
        Transition transition;
        CancellationTokenSource? cancellationTokenSource;

        lock (_syncRoot)
        {
            cancellationTokenSource = DetachLoopLocked();
            _playbackOffsetMs = 0;
            _playbackStartedAtTimestamp = 0;
            transition = UpdatePositionLocked(0, TpsPlaybackStatus.Idle);
        }

        cancellationTokenSource?.Cancel();
        cancellationTokenSource?.Dispose();
        Publish(transition);
        return transition.State;
    }

    public PlayerState Seek(int elapsedMs)
    {
        ThrowIfDisposed();
        Transition transition;
        CancellationTokenSource? cancellationTokenSource = null;

        lock (_syncRoot)
        {
            var requestedStatus = Status == TpsPlaybackStatus.Playing
                ? TpsPlaybackStatus.Playing
                : ResolveStatusAfterSeek(Status, Player.Script.TotalDurationMs, elapsedMs);

            transition = UpdatePositionLocked(elapsedMs, requestedStatus);
            if (transition.Status == TpsPlaybackStatus.Playing)
            {
                _playbackOffsetMs = transition.State.ElapsedMs;
                _playbackStartedAtTimestamp = _timeProvider.GetTimestamp();
            }
            else
            {
                cancellationTokenSource = DetachLoopLocked();
            }
        }

        cancellationTokenSource?.Cancel();
        cancellationTokenSource?.Dispose();
        Publish(transition);
        return transition.State;
    }

    public PlayerState AdvanceBy(int deltaMs)
    {
        var anchorState = GetNavigationAnchorState();
        return Seek(checked(anchorState.ElapsedMs + deltaMs));
    }

    public PlayerState NextWord()
    {
        if (Player.Script.Words.Count == 0)
        {
            return CurrentState;
        }

        var anchorState = GetNavigationAnchorState();
        if (anchorState.CurrentWord is null)
        {
            return Seek(Player.Script.Words[0].StartMs);
        }

        var nextIndex = Math.Min(anchorState.CurrentWord.Index + 1, Player.Script.Words.Count - 1);
        return Seek(Player.Script.Words[nextIndex].StartMs);
    }

    public PlayerState PreviousWord()
    {
        if (Player.Script.Words.Count == 0)
        {
            return CurrentState;
        }

        var anchorState = GetNavigationAnchorState();
        var currentWord = anchorState.CurrentWord;
        if (currentWord is null)
        {
            return Seek(0);
        }

        if (anchorState.ElapsedMs > currentWord.StartMs)
        {
            return Seek(currentWord.StartMs);
        }

        var previousIndex = Math.Max(0, currentWord.Index - 1);
        return Seek(Player.Script.Words[previousIndex].StartMs);
    }

    public PlayerState NextBlock()
    {
        if (_blocks.Count == 0)
        {
            return CurrentState;
        }

        var anchorState = GetNavigationAnchorState();
        var currentIndex = anchorState.CurrentBlock is null
            ? -1
            : _blockIndexById.GetValueOrDefault(anchorState.CurrentBlock.Id, -1);
        var nextIndex = currentIndex < 0 ? 0 : Math.Min(currentIndex + 1, _blocks.Count - 1);
        return Seek(_blocks[nextIndex].StartMs);
    }

    public PlayerState PreviousBlock()
    {
        if (_blocks.Count == 0)
        {
            return CurrentState;
        }

        var anchorState = GetNavigationAnchorState();
        var currentBlock = anchorState.CurrentBlock;
        if (currentBlock is null)
        {
            return Seek(0);
        }

        var currentIndex = _blockIndexById.GetValueOrDefault(currentBlock.Id, 0);
        if (anchorState.ElapsedMs > currentBlock.StartMs)
        {
            return Seek(currentBlock.StartMs);
        }

        var previousIndex = Math.Max(0, currentIndex - 1);
        return Seek(_blocks[previousIndex].StartMs);
    }

    public TpsPlaybackSnapshot IncreaseSpeed(int? stepWpm = null)
    {
        return ChangeSpeedBy(stepWpm ?? SpeedStepWpm);
    }

    public TpsPlaybackSnapshot DecreaseSpeed(int? stepWpm = null)
    {
        return ChangeSpeedBy(-(stepWpm ?? SpeedStepWpm));
    }

    public TpsPlaybackSnapshot SetSpeedOffsetWpm(int offsetWpm)
    {
        ThrowIfDisposed();
        var normalized = NormalizeSpeedOffset(BaseWpm, offsetWpm);
        if (normalized == _speedOffsetWpm)
        {
            return Snapshot;
        }

        Transition transition;
        var restartLoop = false;

        lock (_syncRoot)
        {
            var elapsedMs = Status == TpsPlaybackStatus.Playing
                ? ReadLiveElapsedLocked()
                : CurrentState.ElapsedMs;

            _speedOffsetWpm = normalized;
            transition = UpdatePositionLocked(elapsedMs, Status);

            if (Status == TpsPlaybackStatus.Playing)
            {
                _playbackOffsetMs = transition.State.ElapsedMs;
                _playbackStartedAtTimestamp = _timeProvider.GetTimestamp();
                restartLoop = true;
            }
        }

        if (restartLoop)
        {
            ReplaceRunningLoop();
        }

        Publish(transition);
        return Snapshot;
    }

    public TpsPlaybackSnapshot CreateSnapshot()
    {
        ThrowIfDisposed();
        lock (_syncRoot)
        {
            return CreateSnapshotLocked();
        }
    }

    public void Dispose()
    {
        CancellationTokenSource? cancellationTokenSource;
        lock (_syncRoot)
        {
            if (_disposed)
            {
                return;
            }

            _disposed = true;
            cancellationTokenSource = DetachLoopLocked();
            StateChanged = null;
            WordChanged = null;
            PhraseChanged = null;
            BlockChanged = null;
            SegmentChanged = null;
            StatusChanged = null;
            Completed = null;
            SnapshotChanged = null;
            ListenerException = null;
        }

        cancellationTokenSource?.Cancel();
        cancellationTokenSource?.Dispose();
    }

    private TpsPlaybackSnapshot ChangeSpeedBy(int deltaWpm)
    {
        return SetSpeedOffsetWpm(checked(_speedOffsetWpm + deltaWpm));
    }

    private PlayerState GetNavigationAnchorState()
    {
        lock (_syncRoot)
        {
            return Status == TpsPlaybackStatus.Playing
                ? Player.GetState(ReadLiveElapsedLocked())
                : CurrentState;
        }
    }

    private TpsPlaybackSnapshot CreateSnapshotLocked()
    {
        var state = CurrentState;
        var status = Status;
        var speedOffsetWpm = _speedOffsetWpm;
        var effectiveBaseWpm = ClampWpm(BaseWpm + speedOffsetWpm);
        var playbackRate = BaseWpm <= 0 ? 1d : effectiveBaseWpm / (double)BaseWpm;
        var visibleWords = (state.CurrentPhrase?.Words ?? Array.Empty<CompiledWord>())
            .Select(word => CreateWordView(word, state))
            .ToArray();
        var currentWord = state.CurrentWord;
        var currentSegmentIndex = state.CurrentSegment is null
            ? -1
            : _segmentIndexById.GetValueOrDefault(state.CurrentSegment.Id, -1);
        var currentBlockIndex = state.CurrentBlock is null
            ? -1
            : _blockIndexById.GetValueOrDefault(state.CurrentBlock.Id, -1);
        int? currentWordDurationMs = currentWord is null
            ? null
            : Math.Max(1, (int)Math.Round(currentWord.DisplayDurationMs / playbackRate, MidpointRounding.AwayFromZero));
        int? currentWordRemainingMs = currentWord is null
            ? null
            : Math.Max(0, (int)Math.Round((currentWord.EndMs - state.ElapsedMs) / playbackRate, MidpointRounding.AwayFromZero));

        return new TpsPlaybackSnapshot
        {
            Status = status,
            State = state,
            Tempo = new TpsPlaybackTempo(BaseWpm, effectiveBaseWpm, speedOffsetWpm, SpeedStepWpm, playbackRate),
            Controls = CreateControls(state, status, currentBlockIndex, effectiveBaseWpm),
            VisibleWords = visibleWords,
            FocusedWord = visibleWords.FirstOrDefault(word => word.IsActive),
            CurrentWordDurationMs = currentWordDurationMs,
            CurrentWordRemainingMs = currentWordRemainingMs,
            CurrentSegmentIndex = currentSegmentIndex,
            CurrentBlockIndex = currentBlockIndex
        };
    }

    private TpsPlaybackControls CreateControls(PlayerState state, TpsPlaybackStatus status, int currentBlockIndex, int effectiveBaseWpm)
    {
        var currentWordIndex = state.CurrentWordIndex;
        var canRewindCurrentWord = state.CurrentWord is not null && state.ElapsedMs > state.CurrentWord.StartMs;
        var canRewindCurrentBlock = state.CurrentBlock is not null && state.ElapsedMs > state.CurrentBlock.StartMs;
        return new TpsPlaybackControls(
            CanPlay: status != TpsPlaybackStatus.Playing,
            CanPause: status == TpsPlaybackStatus.Playing,
            CanStop: status != TpsPlaybackStatus.Idle || state.ElapsedMs > 0,
            CanNextWord: Player.Script.Words.Count > 0 && (state.CurrentWord is null || currentWordIndex < Player.Script.Words.Count - 1),
            CanPreviousWord: Player.Script.Words.Count > 0 && (currentWordIndex > 0 || canRewindCurrentWord),
            CanNextBlock: _blocks.Count > 0 && (state.CurrentBlock is null || currentBlockIndex < _blocks.Count - 1),
            CanPreviousBlock: _blocks.Count > 0 && (currentBlockIndex > 0 || canRewindCurrentBlock),
            CanIncreaseSpeed: effectiveBaseWpm < TpsSpec.MaximumWpm,
            CanDecreaseSpeed: effectiveBaseWpm > TpsSpec.MinimumWpm);
    }

    private static TpsPlaybackWordView CreateWordView(CompiledWord word, PlayerState state)
    {
        return new TpsPlaybackWordView
        {
            Word = word,
            IsActive = word.Id == state.CurrentWord?.Id,
            IsRead = word.EndMs <= state.ElapsedMs,
            IsUpcoming = word.StartMs > state.ElapsedMs,
            Emotion = word.Metadata.InlineEmotionHint
                ?? word.Metadata.EmotionHint
                ?? state.CurrentBlock?.Emotion
                ?? state.CurrentSegment?.Emotion
                ?? TpsSpec.DefaultEmotion,
            Speaker = word.Metadata.Speaker ?? state.CurrentBlock?.Speaker ?? state.CurrentSegment?.Speaker,
            EmphasisLevel = word.Metadata.EmphasisLevel,
            IsHighlighted = word.Metadata.IsHighlight,
            DeliveryMode = word.Metadata.DeliveryMode,
            VolumeLevel = word.Metadata.VolumeLevel
        };
    }

    private static IEnumerable<CompiledBlock> FlattenBlocks(CompiledScript script)
    {
        foreach (var segment in script.Segments)
        {
            foreach (var block in segment.Blocks)
            {
                yield return block;
            }
        }
    }

    private static int NormalizeBaseWpm(int value)
    {
        return ClampWpm(value);
    }

    private static int NormalizeSpeedOffset(int baseWpm, int offsetWpm)
    {
        return ClampWpm(baseWpm + offsetWpm) - baseWpm;
    }

    private static int ClampWpm(int value)
    {
        return Math.Min(Math.Max(value, TpsSpec.MinimumWpm), TpsSpec.MaximumWpm);
    }

    private CancellationTokenSource? DetachLoop()
    {
        lock (_syncRoot)
        {
            return DetachLoopLocked();
        }
    }

    private CancellationTokenSource? DetachLoopLocked()
    {
        var current = _playbackCts;
        _playbackCts = null;
        return current;
    }

    private void ReplaceRunningLoop()
    {
        if (Status != TpsPlaybackStatus.Playing)
        {
            return;
        }

        var previousLoop = DetachLoop();
        previousLoop?.Cancel();
        previousLoop?.Dispose();
        var nextLoop = new CancellationTokenSource();
        lock (_syncRoot)
        {
            _playbackCts = nextLoop;
        }

        _ = RunPlaybackLoopAsync(nextLoop);
    }

    private async Task RunPlaybackLoopAsync(CancellationTokenSource cancellationTokenSource)
    {
        try
        {
            while (!cancellationTokenSource.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(_tickIntervalMs), _timeProvider, cancellationTokenSource.Token);

                Transition transition;
                lock (_syncRoot)
                {
                    if (!ReferenceEquals(_playbackCts, cancellationTokenSource) || Status != TpsPlaybackStatus.Playing)
                    {
                        break;
                    }

                    transition = UpdatePositionLocked(ReadLiveElapsedLocked(), TpsPlaybackStatus.Playing);
                    if (transition.CompletedRaised)
                    {
                        _playbackCts = null;
                    }
                }

                Publish(transition);
                if (transition.CompletedRaised)
                {
                    break;
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            lock (_syncRoot)
            {
                if (ReferenceEquals(_playbackCts, cancellationTokenSource))
                {
                    _playbackCts = null;
                }
            }

            cancellationTokenSource.Dispose();
        }
    }

    private int ReadLiveElapsed()
    {
        lock (_syncRoot)
        {
            return ReadLiveElapsedLocked();
        }
    }

    private int ReadLiveElapsedLocked()
    {
        var deltaMs = Math.Max(0d, _timeProvider.GetElapsedTime(_playbackStartedAtTimestamp).TotalMilliseconds);
        return _playbackOffsetMs + (int)Math.Max(0d, Math.Round(deltaMs * PlaybackRate, MidpointRounding.AwayFromZero));
    }

    private Transition UpdatePosition(int elapsedMs, TpsPlaybackStatus requestedStatus)
    {
        lock (_syncRoot)
        {
            return UpdatePositionLocked(elapsedMs, requestedStatus);
        }
    }

    private Transition UpdatePositionLocked(int elapsedMs, TpsPlaybackStatus requestedStatus)
    {
        var previousState = CurrentState;
        var previousStatus = Status;
        var nextState = Player.GetState(elapsedMs);
        var nextStatus = requestedStatus == TpsPlaybackStatus.Playing && nextState.IsComplete
            ? TpsPlaybackStatus.Completed
            : requestedStatus;

        CurrentState = nextState;
        Status = nextStatus;

        if (nextStatus != TpsPlaybackStatus.Playing)
        {
            _playbackOffsetMs = nextState.ElapsedMs;
            _playbackStartedAtTimestamp = 0;
        }

        return new Transition(
            nextState,
            previousState,
            nextStatus,
            previousStatus,
            CreateSnapshotLocked(),
            HasStateChanged(previousState, nextState),
            previousState.CurrentWord?.Id != nextState.CurrentWord?.Id,
            previousState.CurrentPhrase?.Id != nextState.CurrentPhrase?.Id,
            previousState.CurrentBlock?.Id != nextState.CurrentBlock?.Id,
            previousState.CurrentSegment?.Id != nextState.CurrentSegment?.Id,
            previousStatus != nextStatus,
            nextStatus == TpsPlaybackStatus.Completed && previousStatus != TpsPlaybackStatus.Completed);
    }

    private Transition UpdateStatusLocked(TpsPlaybackStatus nextStatus)
    {
        var previousStatus = Status;
        Status = nextStatus;
        return new Transition(
            CurrentState,
            CurrentState,
            nextStatus,
            previousStatus,
            CreateSnapshotLocked(),
            StateChangedRaised: false,
            WordChangedRaised: false,
            PhraseChangedRaised: false,
            BlockChangedRaised: false,
            SegmentChangedRaised: false,
            StatusChangedRaised: previousStatus != nextStatus,
            CompletedRaised: false);
    }

    private void Publish(Transition transition)
    {
        if (transition.StatusChangedRaised)
        {
            InvokeHandlers("statusChanged", StatusChanged, new TpsPlaybackStatusChangedEventArgs(transition.State, transition.PreviousStatus, transition.Status), transition.Snapshot);
        }

        if (transition.StateChangedRaised)
        {
            var args = new TpsPlaybackStateChangedEventArgs(transition.State, transition.PreviousState, transition.Status);
            InvokeHandlers("stateChanged", StateChanged, args, transition.Snapshot);

            if (transition.WordChangedRaised)
            {
                InvokeHandlers("wordChanged", WordChanged, args, transition.Snapshot);
            }

            if (transition.PhraseChangedRaised)
            {
                InvokeHandlers("phraseChanged", PhraseChanged, args, transition.Snapshot);
            }

            if (transition.BlockChangedRaised)
            {
                InvokeHandlers("blockChanged", BlockChanged, args, transition.Snapshot);
            }

            if (transition.SegmentChangedRaised)
            {
                InvokeHandlers("segmentChanged", SegmentChanged, args, transition.Snapshot);
            }

            if (transition.CompletedRaised)
            {
                InvokeHandlers("completed", Completed, args, transition.Snapshot);
            }
        }
        else if (transition.CompletedRaised)
        {
            InvokeHandlers("completed", Completed, new TpsPlaybackStateChangedEventArgs(transition.State, transition.PreviousState, transition.Status), transition.Snapshot);
        }

        InvokeHandlers("snapshotChanged", SnapshotChanged, new TpsPlaybackSnapshotChangedEventArgs(transition.Snapshot), transition.Snapshot);
    }

    private void InvokeHandlers<TEventArgs>(string eventName, EventHandler<TEventArgs>? handlers, TEventArgs args, TpsPlaybackSnapshot snapshot)
    {
        if (handlers is null)
        {
            return;
        }

        foreach (var handler in handlers.GetInvocationList().Cast<EventHandler<TEventArgs>>())
        {
            Dispatch(() =>
            {
                try
                {
                    handler(this, args);
                }
                catch (Exception exception)
                {
                    ReportListenerException(exception, eventName, snapshot);
                }
            });
        }
    }

    private void InvokeSnapshotObserver(
        string eventName,
        Action<TpsPlaybackSnapshot> observer,
        TpsPlaybackSnapshot snapshot,
        SnapshotSubscription? subscription = null)
    {
        Dispatch(() =>
        {
            if (subscription?.IsDisposed == true)
            {
                return;
            }

            try
            {
                observer(snapshot);
            }
            catch (Exception exception)
            {
                ReportListenerException(exception, eventName, snapshot);
            }
        });
    }

    private void ReportListenerException(Exception exception, string eventName, TpsPlaybackSnapshot snapshot)
    {
        var handlers = ListenerException;
        if (handlers is null)
        {
            return;
        }

        var args = new TpsPlaybackListenerExceptionEventArgs(exception, eventName, snapshot, exception.Message);
        foreach (var handler in handlers.GetInvocationList().Cast<EventHandler<TpsPlaybackListenerExceptionEventArgs>>())
        {
            Dispatch(() =>
            {
                try
                {
                    handler(this, args);
                }
                catch
                {
                }
            });
        }
    }

    private void Dispatch(Action callback)
    {
        if (_eventSynchronizationContext is null || ReferenceEquals(SynchronizationContext.Current, _eventSynchronizationContext))
        {
            callback();
            return;
        }

        _eventSynchronizationContext.Post(static state =>
        {
            ((Action)state!).Invoke();
        }, callback);
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
    }

    private static bool HasStateChanged(PlayerState previousState, PlayerState nextState)
    {
        return previousState.ElapsedMs != nextState.ElapsedMs
            || previousState.RemainingMs != nextState.RemainingMs
            || previousState.Progress != nextState.Progress
            || previousState.IsComplete != nextState.IsComplete
            || previousState.CurrentWord?.Id != nextState.CurrentWord?.Id
            || previousState.CurrentPhrase?.Id != nextState.CurrentPhrase?.Id
            || previousState.CurrentBlock?.Id != nextState.CurrentBlock?.Id
            || previousState.CurrentSegment?.Id != nextState.CurrentSegment?.Id;
    }

    private static TpsPlaybackStatus ResolveStatusAfterSeek(TpsPlaybackStatus previousStatus, int totalDurationMs, int elapsedMs)
    {
        if (totalDurationMs == 0 || elapsedMs >= totalDurationMs)
        {
            return TpsPlaybackStatus.Completed;
        }

        if (elapsedMs <= 0 && previousStatus == TpsPlaybackStatus.Idle)
        {
            return TpsPlaybackStatus.Idle;
        }

        return TpsPlaybackStatus.Paused;
    }

    private sealed record Transition(
        PlayerState State,
        PlayerState PreviousState,
        TpsPlaybackStatus Status,
        TpsPlaybackStatus PreviousStatus,
        TpsPlaybackSnapshot Snapshot,
        bool StateChangedRaised,
        bool WordChangedRaised,
        bool PhraseChangedRaised,
        bool BlockChangedRaised,
        bool SegmentChangedRaised,
        bool StatusChangedRaised,
        bool CompletedRaised);

    private sealed class SnapshotSubscription(Action dispose) : IDisposable
    {
        private Action? _dispose = dispose;
        private int _disposed;

        public bool IsDisposed => Volatile.Read(ref _disposed) != 0;

        public void Dispose()
        {
            if (Interlocked.Exchange(ref _disposed, 1) == 0)
            {
                Interlocked.Exchange(ref _dispose, null)?.Invoke();
            }
        }
    }
}
