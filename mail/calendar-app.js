// CalendarApp: Interactive calendar for Enron Mail
// This file implements a calendar view with schedule, daily, weekly, and monthly views.
// It uses the site’s existing color scheme and opens to the current month in 2001.

class CalendarApp {
    constructor(events) {
        this.events = events;
        this.currentView = 'month';
        const today = new Date();
        this.year = 2001;
        this.month = today.getMonth();
        this.day = today.getDate();
        this.render();
    }

    render() {
        const container = document.getElementById('calendar-container');
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this.renderHeader());
        container.appendChild(this.renderViewSwitcher());
        container.appendChild(this.renderCurrentView());
    }

    renderHeader() {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<';
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.onclick = () => { this.navigate(-1); };

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>';
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.onclick = () => { this.navigate(1); };

            let title = '';
            if (this.currentView === 'month') {
                title = `${this.getMonthName(this.month)} ${this.year}`;
            } else if (this.currentView === 'week') {
                const weekRange = this.getWeekRange();
                title = `${weekRange}`;
            } else if (this.currentView === 'day') {
                title = `${this.getMonthName(this.month)} ${this.day}, ${this.year}`;
            } else if (this.currentView === 'schedule') {
                title = `${this.getMonthName(this.month)} ${this.year}`;
            }
            const titleElement = document.createElement('span');
            titleElement.className = 'calendar-title calendar-label';
            titleElement.textContent = title;

        header.appendChild(prevBtn);
            header.appendChild(titleElement);
        header.appendChild(nextBtn);
        return header;
    }

    renderViewSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'calendar-switcher';
        switcher.style.display = 'flex';
        switcher.style.justifyContent = 'space-between';
        switcher.style.gap = '8px';
        ['month', 'week', 'day', 'schedule'].forEach(view => {
            const btn = document.createElement('button');
            btn.textContent = view.charAt(0).toUpperCase() + view.slice(1);
            btn.className = 'calendar-switch-btn' + (this.currentView === view ? ' active' : '');
            btn.style.flex = '1 1 0';
            btn.onclick = () => { this.currentView = view; this.render(); };
            switcher.appendChild(btn);
        });
        switcher.style.marginBottom = '10px';
        return switcher;
    }

    renderCurrentView() {
        if (this.currentView === 'month') return this.renderMonthView();
        if (this.currentView === 'week') return this.renderWeekView();
        if (this.currentView === 'day') return this.renderDayView();
        return this.renderScheduleView();
    }

    renderMonthView() {
        const table = document.createElement('table');
        table.className = 'calendar-table';
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
            const th = document.createElement('th');
            th.textContent = d;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);

        const firstDay = new Date(this.year, this.month, 1).getDay();
        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                cell.style.verticalAlign = 'top';
                if (i === 0 && j < firstDay) {
                    cell.textContent = '';
                } else if (date > daysInMonth) {
                    cell.textContent = '';
                } else {
                    // Day number
                    const dayDiv = document.createElement('div');
                    dayDiv.textContent = date;
                    dayDiv.className = 'calendar-date-label';
                    dayDiv.style.color = '#0066cc';
                    dayDiv.style.fontWeight = 'bold';
                    dayDiv.style.marginBottom = '2px';
                    cell.appendChild(dayDiv);
                    cell.className = 'calendar-date-cell';
                    if (date === this.day && this.currentView === 'month') cell.className += ' today';
                    // Show up to 3 events
                    const currentDate = date; // Capture current date value
                    const events = this.getEventsForDate(this.year, this.month, currentDate);
                    for (let k = 0; k < Math.min(3, events.length); k++) {
                        const ev = events[k];
                        const evDiv = document.createElement('div');
                        evDiv.className = 'calendar-event';
                        // Event time and truncated description (time on first row, desc on second row)
                        const time = this.formatTime(ev.start);
                        const desc = (ev.subject || 'Event');
                        evDiv.innerHTML = `<div class=\"calendar-event-time\">${time ? time : ''}</div><div class=\"calendar-event-desc\">${desc}</div>`;
                        evDiv.title = desc;
                        evDiv.onclick = (e) => {
                            e.stopPropagation();
                            this.day = currentDate;
                            this.currentView = 'day';
                            this.render();
                        };
                        cell.appendChild(evDiv);
                    }
                    if (events.length > 3) {
                        const moreBtn = document.createElement('button');
                        moreBtn.className = 'calendar-more-btn';
                        moreBtn.textContent = `+${events.length - 3} more`;
                        moreBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.day = currentDate;
                            this.currentView = 'day';
                            this.render();
                        };
                        cell.appendChild(moreBtn);
                    }
                    cell.onclick = () => {
                        this.day = currentDate;
                        this.currentView = 'day';
                        this.render();
                    };
                    date++;
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
            if (date > daysInMonth) break;
        }
        return table;
    }

    renderWeekView() {
        const week = this.getWeekDates();
        const container = document.createElement('div');
        container.className = 'calendar-week-view';
        
        // Create table with 2 rows: Mon-Fri, then Sat-Sun
        const table = document.createElement('table');
        table.className = 'calendar-week-table';
        
        // Row 1: Monday through Friday (indices 1-5)
        const row1 = document.createElement('tr');
        for (let i = 1; i <= 5; i++) {
            const dateObj = week[i];
            const cell = this.createWeekDayCell(dateObj);
            row1.appendChild(cell);
        }
        table.appendChild(row1);
        
        // Row 2: Saturday and Sunday (indices 6 and 0)
        const row2 = document.createElement('tr');
        [6, 0].forEach(i => {
            const dateObj = week[i];
            const cell = this.createWeekDayCell(dateObj);
            row2.appendChild(cell);
        });
        table.appendChild(row2);
        
        container.appendChild(table);
        return container;
    }
    
    createWeekDayCell(dateObj) {
        const cell = document.createElement('td');
        cell.className = 'calendar-week-day';
        cell.style.verticalAlign = 'top';
        
        // Day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-week-day-header';
        const dayOfWeek = new Date(dateObj.year, dateObj.month, dateObj.date).toLocaleDateString('en-US', { weekday: 'short' });
        dayHeader.textContent = `${dayOfWeek}, ${this.getMonthName(dateObj.month)} ${dateObj.date}`;
        cell.appendChild(dayHeader);
        
        // Get events for this day
        const events = this.getEventsForDate(dateObj.year, dateObj.month, dateObj.date);
        
        // Show up to 3 events
        for (let k = 0; k < Math.min(3, events.length); k++) {
            const ev = events[k];
            const evDiv = document.createElement('div');
            evDiv.className = 'calendar-event';
            const time = this.formatTime(ev.start);
            const desc = (ev.subject || 'Event');
            evDiv.innerHTML = `<div class="calendar-event-time">${time ? time : ''}</div><div class="calendar-event-desc">${desc}</div>`;
            evDiv.title = desc;
            evDiv.onclick = (e) => {
                e.stopPropagation();
                this.day = dateObj.date;
                this.month = dateObj.month;
                this.year = dateObj.year;
                this.currentView = 'day';
                this.render();
            };
            cell.appendChild(evDiv);
        }
        
        // Show "more" button if there are more than 3 events
        if (events.length > 3) {
            const moreBtn = document.createElement('button');
            moreBtn.className = 'calendar-more-btn';
            moreBtn.textContent = `+${events.length - 3} more`;
            moreBtn.onclick = (e) => {
                e.stopPropagation();
                this.day = dateObj.date;
                this.month = dateObj.month;
                this.year = dateObj.year;
                this.currentView = 'day';
                this.render();
            };
            cell.appendChild(moreBtn);
        }
        
        // Make cell clickable
        cell.onclick = () => {
            this.day = dateObj.date;
            this.month = dateObj.month;
            this.year = dateObj.year;
            this.currentView = 'day';
            this.render();
        };
        
        return cell;
    }

    renderDayView() {
        const container = document.createElement('div');
        container.className = 'calendar-day-view';
        const events = this.getEventsForDate(this.year, this.month, this.day);
        
        if (!events.length) {
            container.textContent = 'No events for this day.';
            return container;
        }
        
        // Create hourly table
        const table = document.createElement('table');
        table.className = 'calendar-hourly-table';
        
        // Group events by hour and sort
        const eventsByHour = {};
        events.forEach(ev => {
            const hour = new Date(ev.start).getHours();
            if (!eventsByHour[hour]) eventsByHour[hour] = [];
            eventsByHour[hour].push(ev);
        });
        
        // Sort events within each hour chronologically
        Object.values(eventsByHour).forEach(hourEvents => {
            hourEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        });
        
        // Get hour range (earliest to latest event, or 8am-6pm default)
        const hours = Object.keys(eventsByHour).map(h => parseInt(h));
        const minHour = hours.length > 0 ? Math.min(...hours, 8) : 8;
        const maxHour = hours.length > 0 ? Math.max(...hours, 18) : 18;
        
        // Create rows for each hour
        for (let hour = minHour; hour <= maxHour; hour++) {
            const row = document.createElement('tr');
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'calendar-time-cell';
            const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
            const ampm = hour < 12 ? 'AM' : 'PM';
            timeCell.textContent = `${displayHour}:00 ${ampm}`;
            row.appendChild(timeCell);
            
            // Events cell
            const eventsCell = document.createElement('td');
            eventsCell.className = 'calendar-events-cell';
            
            if (eventsByHour[hour]) {
                eventsByHour[hour].forEach(ev => {
                    const evDiv = document.createElement('div');
                    evDiv.className = 'calendar-event';
                    const time = this.formatTime(ev.start);
                    const endTime = ev.end ? ` - ${this.formatTime(ev.end)}` : '';
                    evDiv.textContent = `${time}${endTime}: ${ev.subject || 'Event'}`;
                    eventsCell.appendChild(evDiv);
                });
            } else {
                eventsCell.innerHTML = '<span style="color: #999;">—</span>';
            }
            
            row.appendChild(eventsCell);
            table.appendChild(row);
        }
        
        container.appendChild(table);
        return container;
    }

    renderScheduleView() {
        const container = document.createElement('div');
        container.className = 'calendar-schedule-view';
        const events = this.getEventsForMonth(this.year, this.month);
        
        if (!events.length) {
            container.textContent = 'No events scheduled for this month.';
            return container;
        }
        
        // Group events by date and hour
        const eventsByDate = {};
        events.forEach(ev => {
            const eventDate = new Date(ev.start);
            const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
            const hour = eventDate.getHours();
            
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = { date: eventDate, byHour: {} };
            }
            if (!eventsByDate[dateKey].byHour[hour]) {
                eventsByDate[dateKey].byHour[hour] = [];
            }
            eventsByDate[dateKey].byHour[hour].push(ev);
        });
        
        // Sort dates chronologically
        const sortedDates = Object.keys(eventsByDate).sort((a, b) => 
            eventsByDate[a].date - eventsByDate[b].date
        );
        
        // Create day sections
        sortedDates.forEach(dateKey => {
            const dayData = eventsByDate[dateKey];
            const date = dayData.date;
            
            // Day header
            const dayHeader = document.createElement('h3');
            dayHeader.style.cssText = 'color: #0066cc; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #ff9900; padding-bottom: 5px;';
            dayHeader.textContent = `${this.getMonthName(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`;
            container.appendChild(dayHeader);
            
            // Create hourly table
            const table = document.createElement('table');
            table.className = 'calendar-hourly-table';
            table.style.marginBottom = '15px';
            
            // Get hours and sort events within each
            const hours = Object.keys(dayData.byHour).map(h => parseInt(h)).sort((a, b) => a - b);
            hours.forEach(hour => {
                dayData.byHour[hour].sort((a, b) => new Date(a.start) - new Date(b.start));
            });
            
            hours.forEach(hour => {
                const row = document.createElement('tr');
                
                // Time cell
                const timeCell = document.createElement('td');
                timeCell.className = 'calendar-time-cell';
                const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
                const ampm = hour < 12 ? 'AM' : 'PM';
                timeCell.textContent = `${displayHour}:00 ${ampm}`;
                row.appendChild(timeCell);
                
                // Events cell
                const eventsCell = document.createElement('td');
                eventsCell.className = 'calendar-events-cell';
                
                dayData.byHour[hour].forEach(ev => {
                    const evDiv = document.createElement('div');
                    evDiv.className = 'calendar-event';
                    const time = this.formatTime(ev.start);
                    const endTime = ev.end ? ` - ${this.formatTime(ev.end)}` : '';
                    evDiv.textContent = `${time}${endTime}: ${ev.subject || 'Event'}`;
                    eventsCell.appendChild(evDiv);
                });
                
                row.appendChild(eventsCell);
                table.appendChild(row);
            });
            
            container.appendChild(table);
        });
        
        return container;
    }

    navigate(dir) {
        if (this.currentView === 'month' || this.currentView === 'schedule') {
            this.month += dir;
            if (this.month < 0) { this.month = 11; this.year--; }
            if (this.month > 11) { this.month = 0; this.year++; }
        } else if (this.currentView === 'week' || this.currentView === 'day') {
            const date = new Date(this.year, this.month, this.day + dir * (this.currentView === 'week' ? 7 : 1));
            this.year = date.getFullYear();
            this.month = date.getMonth();
            this.day = date.getDate();
        }
        this.render();
    }

    getMonthName(m) {
        return ['January','February','March','April','May','June','July','August','September','October','November','December'][m];
    }

    getEventsForDate(y, m, d) {
        return this.events.filter(ev => {
            const date = new Date(ev.start);
            return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
        });
    }

    getEventsForMonth(y, m) {
        return this.events.filter(ev => {
            const date = new Date(ev.start);
            return date.getFullYear() === y && date.getMonth() === m;
        });
    }

    getWeekDates() {
        const date = new Date(this.year, this.month, this.day);
        const day = date.getDay();
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(date);
            d.setDate(date.getDate() - day + i);
            week.push({ year: d.getFullYear(), month: d.getMonth(), date: d.getDate() });
        }
        return week;
    }

    getWeekRange() {
        const week = this.getWeekDates();
        return `${this.getMonthName(week[0].month)} ${week[0].date} - ${this.getMonthName(week[6].month)} ${week[6].date}, ${week[0].year}`;
    }

    formatDate(dt) {
        const d = new Date(dt);
        return `${this.getMonthName(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
    }

    formatTime(dt) {
        if (!dt) return '';
        const d = new Date(dt);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Add styles for the calendar (using site’s color scheme)
(function addCalendarStyles() {
    if (document.getElementById('calendar-styles')) return;
    const style = document.createElement('style');
    style.id = 'calendar-styles';
    style.textContent = `
    .calendar-header, .calendar-switcher { font-family: inherit; }
    .calendar-nav-btn, .calendar-switch-btn {
        background: #0066cc;
        color: #fff;
        border: 1px solid #0066cc;
        border-radius: 4px;
        padding: 4px 10px;
        margin: 0 2px;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, border 0.2s;
    }
    .calendar-nav-btn:hover, .calendar-switch-btn:hover {
        background: #ff9900;
        color: #fff;
        border: 1px solid #ff9900;
    }
    .calendar-switch-btn.active {
        background: #ff9900;
        color: #fff;
        border: 1px solid #ff9900;
    }
    .calendar-title, .calendar-label {
        font-size: 1.2em;
        font-weight: bold;
        color: #0066cc;
    }
    .calendar-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
    .calendar-table th, .calendar-table td { border: 1px solid #ccc; text-align: center; padding: 6px; vertical-align: top; }
    .calendar-table th { color: #0066cc; font-weight: bold; }
    .calendar-date-cell { cursor: pointer; position: relative; min-height: 60px; word-break: break-word; }
    .calendar-date-cell.today { background: #e6f7ff; border: 2px solid #ff9900; }
    .calendar-date-label { color: #0066cc; font-weight: bold; font-size: 13px; margin-bottom: 2px; }
    .calendar-event-dot { width: 6px; height: 6px; background: #ff9900; border-radius: 50%; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); }
    .calendar-event { background: #fffbe6; border-left: 4px solid #ff9900; margin: 4px 0; padding: 2px 6px; border-radius: 3px; color: #333; font-size: 11px; display: block; overflow: hidden; }
    .calendar-event-time { color: #0066cc; font-weight: bold; font-size: 10px; margin-bottom: 0; display: block; }
    .calendar-event-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; font-size: 11px; max-width: 100%; margin-top: 0; }
    .calendar-week-view { width: 100%; }
    .calendar-week-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .calendar-week-day { border: 1px solid #ccc; padding: 8px; cursor: pointer; min-height: 100px; word-break: break-word; background: #fff; }
    .calendar-week-day:hover { background: #f8f8f8; }
    .calendar-week-day-header { color: #0066cc; font-weight: bold; font-size: 13px; margin-bottom: 6px; border-bottom: 2px solid #ff9900; padding-bottom: 4px; }
    .calendar-hourly-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .calendar-time-cell { width: 100px; padding: 8px; border: 1px solid #ccc; background-color: #f5f5f5; color: #0066cc; font-weight: bold; text-align: right; vertical-align: top; font-size: 11px; }
    .calendar-events-cell { padding: 8px; border: 1px solid #ccc; vertical-align: top; }
    .calendar-day-view, .calendar-schedule-view { padding: 8px; }
    .calendar-more-btn { background: none; border: none; color: #0066cc; cursor: pointer; font-size: 11px; text-decoration: underline; margin-top: 2px; }
    .calendar-more-btn:hover { color: #ff9900; }
    `;
    document.head.appendChild(style);
})();

// Ensure CalendarApp is globally available
window.CalendarApp = CalendarApp;
