// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "ManagedCodeTps",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "ManagedCodeTps",
            targets: ["ManagedCodeTps"]
        )
    ],
    targets: [
        .target(
            name: "ManagedCodeTps"
        ),
        .testTarget(
            name: "ManagedCodeTpsTests",
            dependencies: ["ManagedCodeTps"],
            path: "Tests/ManagedCodeTpsTests"
        )
    ]
)
