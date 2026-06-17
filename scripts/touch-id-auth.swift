#!/usr/bin/env swift

import Foundation
import LocalAuthentication

let context = LAContext()
var error: NSError?

// Check if biometric authentication is available
guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
    if let error = error {
        print("UNAVAILABLE:\(error.localizedDescription)")
    } else {
        print("UNAVAILABLE:Touch ID not available")
    }
    exit(1)
}

// Get the reason from command line arguments
let reason = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Authenticate to continue"

// Create a semaphore to wait for async result
let semaphore = DispatchSemaphore(value: 0)
var authResult = false

// Attempt biometric authentication
context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, authError in
    authResult = success
    semaphore.signal()
}

// Wait for authentication to complete
semaphore.wait()

// Print result
if authResult {
    print("SUCCESS")
    exit(0)
} else {
    print("FAILED:Authentication failed or cancelled")
    exit(1)
}
