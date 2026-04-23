//
//  Project.swift
//  BugScribe
//
//  Project model
//

import Foundation

struct Project: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    let projectId: String
    let apiKey: String
    var connectionKey: String
    let addedAt: Date
    
    init(id: String = UUID().uuidString,
         name: String,
         projectId: String,
         apiKey: String,
         connectionKey: String = "",
         addedAt: Date = Date()) {
        self.id = id
        self.name = name
        self.projectId = projectId
        self.apiKey = apiKey
        self.connectionKey = connectionKey
        self.addedAt = addedAt
    }
}
