//
//  StorageManager.swift
//  BugScribe
//
//  Local storage manager using UserDefaults
//

import Foundation
import Combine

class StorageManager: ObservableObject {
    static let shared = StorageManager()
    
    @Published var projects: [Project] = []
    @Published var activeProject: Project?
    @Published var userName: String?
    @Published var userEmail: String?
    
    private let projectsKey = "bugscribe_projects"
    private let activeProjectKey = "bugscribe_active_project"
    private let userNameKey = "bugscribe_user_name"
    private let userEmailKey = "bugscribe_user_email"
    
    private init() {
        loadProjects()
        loadUserInfo()
    }
    
    // MARK: - Projects
    
    func loadProjects() {
        if let data = UserDefaults.standard.data(forKey: projectsKey),
           let decoded = try? JSONDecoder().decode([Project].self, from: data) {
            projects = decoded
        }
        
        if let activeId = UserDefaults.standard.string(forKey: activeProjectKey) {
            activeProject = projects.first { $0.id == activeId }
        }
        
        // Set first project as active if none selected
        if activeProject == nil && !projects.isEmpty {
            activeProject = projects[0]
        }
    }
    
    func saveProjects() {
        if let encoded = try? JSONEncoder().encode(projects) {
            UserDefaults.standard.set(encoded, forKey: projectsKey)
        }
        
        if let activeId = activeProject?.id {
            UserDefaults.standard.set(activeId, forKey: activeProjectKey)
        }
    }
    
    func addProject(_ project: Project) {
        projects.append(project)
        if activeProject == nil {
            activeProject = project
        }
        saveProjects()
    }
    
    func removeProject(_ project: Project) {
        projects.removeAll { $0.id == project.id }
        
        if activeProject?.id == project.id {
            activeProject = projects.first
        }
        
        saveProjects()
    }
    
    func setActiveProject(_ project: Project) {
        activeProject = project
        saveProjects()
    }
    
    // MARK: - User Info
    
    func loadUserInfo() {
        userName = UserDefaults.standard.string(forKey: userNameKey)
        userEmail = UserDefaults.standard.string(forKey: userEmailKey)
    }
    
    func saveUserInfo(name: String, email: String) {
        userName = name
        userEmail = email
        UserDefaults.standard.set(name, forKey: userNameKey)
        UserDefaults.standard.set(email, forKey: userEmailKey)
    }
}
