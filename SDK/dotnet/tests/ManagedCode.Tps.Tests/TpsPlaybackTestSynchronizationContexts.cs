namespace ManagedCode.Tps.Tests;

internal sealed class RecordingSynchronizationContext : SynchronizationContext
{
    public int PostCount { get; private set; }

    public override void Post(SendOrPostCallback d, object? state)
    {
        PostCount++;
        d(state);
    }
}

internal sealed class QueuedSynchronizationContext : SynchronizationContext
{
    private readonly Queue<(SendOrPostCallback Callback, object? State)> _queue = new();

    public override void Post(SendOrPostCallback d, object? state)
    {
        _queue.Enqueue((d, state));
    }

    public void Drain()
    {
        var previous = Current;
        SetSynchronizationContext(this);
        try
        {
            while (_queue.TryDequeue(out var workItem))
            {
                workItem.Callback(workItem.State);
            }
        }
        finally
        {
            SetSynchronizationContext(previous);
        }
    }
}
