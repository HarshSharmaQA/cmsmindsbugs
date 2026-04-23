//
//  ContentView.swift
//  BugScribe
//
//  Main navigation view
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var storageManager: StorageManager
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ProjectListView()
                .tabItem {
                    Label("Projects", systemImage: "folder.fill")
                }
                .tag(0)
            
            if storageManager.activeProject != nil {
                BugReportView()
                    .tabItem {
                        Label("Report Bug", systemImage: "ladybug.fill")
                    }
                    .tag(1)
            }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
        .accentColor(.red)
    }
}

struct SettingsView: View {
    @EnvironmentObject var storageManager: StorageManager
    @State private var userName: String = ""
    @State private var userEmail: String = ""
    @State private var showingSaveAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("User Information")) {
                    TextField("Name", text: $userName)
                        .textContentType(.name)
                    
                    TextField("Email", text: $userEmail)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                
                Section(header: Text("Active Project")) {
                    if let project = storageManager.activeProject {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(project.name)
                                .font(.headline)
                            Text("ID: \(project.projectId)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        Text("No active project")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section {
                    Button("Save User Information") {
                        storageManager.saveUserInfo(name: userName, email: userEmail)
                        showingSaveAlert = true
                    }
                    .disabled(userName.isEmpty)
                }
                
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .onAppear {
                userName = storageManager.userName ?? ""
                userEmail = storageManager.userEmail ?? ""
            }
            .alert("Saved", isPresented: $showingSaveAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text("User information saved successfully")
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(StorageManager.shared)
}
