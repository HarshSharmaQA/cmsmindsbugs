//
//  ProjectListView.swift
//  BugScribe
//
//  Project management view
//

import SwiftUI

struct ProjectListView: View {
    @EnvironmentObject var storageManager: StorageManager
    @State private var showingAddProject = false
    @State private var showingDeleteAlert = false
    @State private var projectToDelete: Project?
    
    var body: some View {
        NavigationView {
            ZStack {
                if storageManager.projects.isEmpty {
                    EmptyProjectsView(showingAddProject: $showingAddProject)
                } else {
                    List {
                        ForEach(storageManager.projects) { project in
                            ProjectRow(
                                project: project,
                                isActive: storageManager.activeProject?.id == project.id,
                                onSelect: {
                                    storageManager.setActiveProject(project)
                                },
                                onDelete: {
                                    projectToDelete = project
                                    showingDeleteAlert = true
                                }
                            )
                        }
                    }
                }
            }
            .navigationTitle("Projects")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddProject = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddProject) {
                AddProjectView()
            }
            .alert("Delete Project", isPresented: $showingDeleteAlert, presenting: projectToDelete) { project in
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    storageManager.removeProject(project)
                }
            } message: { project in
                Text("Are you sure you want to delete '\(project.name)'?")
            }
        }
    }
}

struct EmptyProjectsView: View {
    @Binding var showingAddProject: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("No Projects")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Add your first project to start reporting bugs")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: { showingAddProject = true }) {
                Label("Add Project", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
            }
            .padding(.top)
        }
        .padding()
    }
}

struct ProjectRow: View {
    let project: Project
    let isActive: Bool
    let onSelect: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text(project.name)
                    .font(.headline)
                
                Text("ID: \(project.projectId.prefix(12))...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if isActive {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            onSelect()
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

struct AddProjectView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var storageManager: StorageManager
    
    @State private var projectName = ""
    @State private var projectId = ""
    @State private var apiKey = ""
    @State private var connectionKey = ""
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Project Details")) {
                    TextField("Project Name", text: $projectName)
                        .textContentType(.name)
                    
                    TextField("Project ID", text: $projectId)
                        .textContentType(.username)
                        .autocapitalization(.none)
                    
                    TextField("API Key", text: $apiKey)
                        .textContentType(.password)
                        .autocapitalization(.none)
                }
                
                Section(header: Text("Optional")) {
                    TextField("Connection Key", text: $connectionKey)
                        .autocapitalization(.none)
                }
                
                Section {
                    Button("Add Project") {
                        addProject()
                    }
                    .disabled(!isValid)
                }
            }
            .navigationTitle("Add Project")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private var isValid: Bool {
        !projectName.isEmpty && !projectId.isEmpty && !apiKey.isEmpty
    }
    
    private func addProject() {
        guard isValid else {
            errorMessage = "Please fill in all required fields"
            showingError = true
            return
        }
        
        let project = Project(
            name: projectName,
            projectId: projectId,
            apiKey: apiKey,
            connectionKey: connectionKey
        )
        
        storageManager.addProject(project)
        dismiss()
    }
}

#Preview {
    ProjectListView()
        .environmentObject(StorageManager.shared)
}
