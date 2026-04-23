//
//  BugScribeApp.swift
//  BugScribe
//
//  Created on 2026
//

import SwiftUI

@main
struct BugScribeApp: App {
    @StateObject private var storageManager = StorageManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(storageManager)
        }
    }
}
