import React from 'react';
import { Calendar, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardWidget {
  title: string;
  icon: React.ReactNode;
  description: string;
  link: string;
  preview: React.ReactNode;
}

export const DashboardWidgets: React.FC = () => {
  const widgets: DashboardWidget[] = [
    {
      title: 'Calendar',
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      description: 'Upcoming events and tasks',
      link: '/calendar',
      preview: <CalendarPreview />
    },
    {
      title: 'Trackers',
      icon: <FileSpreadsheet className="h-6 w-6 text-green-600" />,
      description: 'Custom spreadsheet trackers',
      link: '/trackers',
      preview: <TrackerPreview />
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {widgets.map((widget) => (
        <div key={widget.title} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Widget Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {widget.icon}
                <div>
                  <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                  <p className="text-sm text-gray-500">{widget.description}</p>
                </div>
              </div>
              <Link
                to={widget.link}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Widget Preview */}
          <div className="p-4">
            {widget.preview}
          </div>
        </div>
      ))}
    </div>
  );
};

// Calendar Preview Component
const CalendarPreview: React.FC = () => {
  const today = new Date();
  const upcomingEvents = [
    { title: 'Team Meeting', time: '10:00 AM', type: 'event', color: 'blue' },
    { title: 'Project Deadline', time: '5:00 PM', type: 'task', color: 'red' },
    { title: 'Review Code', time: 'Tomorrow', type: 'task', color: 'yellow' }
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-3">
        {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
      
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event, index) => (
          <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
            <div className={`w-1 h-full bg-${event.color}-500 rounded`}></div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">{event.title}</div>
              <div className="text-xs text-gray-500">{event.time}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded bg-${event.color}-100 text-${event.color}-700`}>
              {event.type}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No upcoming events</p>
        </div>
      )}
    </div>
  );
};

// Tracker Preview Component
const TrackerPreview: React.FC = () => {
  const trackers = [
    { name: 'Habit Tracker', items: 12, updated: '2 hours ago', progress: 75 },
    { name: 'Project Milestones', items: 8, updated: 'Yesterday', progress: 50 },
    { name: 'Weekly Goals', items: 5, updated: 'Today', progress: 100 }
  ];

  return (
    <div className="space-y-3">
      {trackers.length > 0 ? (
        trackers.map((tracker, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm text-gray-900">{tracker.name}</div>
              <span className="text-xs text-gray-500">{tracker.items} items</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${tracker.progress}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{tracker.progress}% complete</span>
              <span>Updated {tracker.updated}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No trackers yet</p>
          <Link to="/trackers" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Create your first tracker
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardWidgets;