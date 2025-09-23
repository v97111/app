//
//  RemindersWidget.swift
//  RemindersWidget
//
//  iOS Widget for displaying reminders from the main app
//

import WidgetKit
import SwiftUI

struct RemindersWidgetEntryView : View {
    var entry: RemindersEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "bell.fill")
                    .foregroundColor(.blue)
                Text("Reminders")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            if entry.reminders.isEmpty {
                VStack {
                    Image(systemName: "checkmark.circle")
                        .font(.title2)
                        .foregroundColor(.green)
                    Text("All caught up!")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ForEach(entry.reminders.prefix(3), id: \.id) { reminder in
                    HStack {
                        Circle()
                            .fill(reminder.isOverdue ? Color.red : Color.orange)
                            .frame(width: 8, height: 8)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(reminder.title)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)
                            
                            Text(reminder.timeText)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                }
                
                if entry.reminders.count > 3 {
                    Text("+\(entry.reminders.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .widgetURL(URL(string: "myapp://reminders"))
    }
}

struct RemindersEntry: TimelineEntry {
    let date: Date
    let reminders: [ReminderItem]
}

struct ReminderItem {
    let id: String
    let title: String
    let dueDate: Date
    let timeText: String
    let isOverdue: Bool
}

struct RemindersProvider: TimelineProvider {
    func placeholder(in context: Context) -> RemindersEntry {
        RemindersEntry(date: Date(), reminders: [
            ReminderItem(
                id: "1",
                title: "Sample Reminder",
                dueDate: Date(),
                timeText: "2:00 PM",
                isOverdue: false
            )
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (RemindersEntry) -> ()) {
        let entry = RemindersEntry(date: Date(), reminders: loadReminders())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let entry = RemindersEntry(date: currentDate, reminders: loadReminders())
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    private func loadReminders() -> [ReminderItem] {
        // In a real implementation, this would read from shared app group or API
        // For now, return sample data
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        
        return [
            ReminderItem(
                id: "1",
                title: "Review project proposal",
                dueDate: Date(),
                timeText: formatter.string(from: Date()),
                isOverdue: false
            ),
            ReminderItem(
                id: "2",
                title: "Team meeting",
                dueDate: Date().addingTimeInterval(3600),
                timeText: formatter.string(from: Date().addingTimeInterval(3600)),
                isOverdue: false
            )
        ]
    }
}

@main
struct RemindersWidget: Widget {
    let kind: String = "RemindersWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RemindersProvider()) { entry in
            RemindersWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Reminders")
        .description("View your upcoming reminders at a glance")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct RemindersWidget_Previews: PreviewProvider {
    static var previews: some View {
        RemindersWidgetEntryView(entry: RemindersEntry(date: Date(), reminders: [
            ReminderItem(
                id: "1",
                title: "Sample Reminder",
                dueDate: Date(),
                timeText: "2:00 PM",
                isOverdue: false
            )
        ]))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}