import { DayPilotCalendar } from "@daypilot/daypilot-lite-react";
import { Box, Button, Icon } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { FaSync } from "react-icons/fa";
import LoginButton from "./LoginButton";
import { listCalendarEvents, listCalendars, isAuthenticated } from "../services/google-auth-service";


export default function Calendar({ isPortrait }: { isPortrait: boolean }) {
  const startDate = DateTime.now().toISODate();

  const [cellHeight, setCellHeight] = useState(35);

  const [events, setEvents] = useState<any[]>([]); 
  const [calendars, setCalendars] = useState<any[]>([]);
  const [dayPilotEvents, setDayPilotEvents] = useState<any[]>([]);

  
  // Fetch calendar events when authenticated
  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated()) {
        setEvents([]);
        setCalendars([]);
        setDayPilotEvents([]);
        return;
      }

      try {
        // Get list of calendars
        const calendarsData = await listCalendars();
        setCalendars(calendarsData.items || []);

        // Get events from primary calendar - fetch from start of today
        const today = DateTime.now();
        const startOfDay = today.startOf('day').toISO();
        const eventsData = await listCalendarEvents('primary', 50, startOfDay || undefined);
        const rawEvents = eventsData.items || [];
        setEvents(rawEvents);

        // Convert Google Calendar events to DayPilot format
        const formattedEvents = rawEvents.map((event: any) => {
          // Handle all-day events (date) vs timed events (dateTime)
          const isAllDay = !event.start?.dateTime;
          
          let start: string;
          let end: string;
          
          if (isAllDay) {
            // All-day events: use date only (no time conversion needed)
            start = event.start?.date || '';
            end = event.end?.date || '';
          } else {
            // Timed events: Google Calendar returns times in UTC (or with timezone)
            // Parse and convert to local timezone for DayPilot
            let startUTC: DateTime;
            let endUTC: DateTime;
            
            // Check if the time is in UTC (ends with Z) or has timezone info
            if (event.start.dateTime.endsWith('Z')) {
              // Explicitly UTC - parse as UTC
              startUTC = DateTime.fromISO(event.start.dateTime, { zone: 'utc' });
            } else {
              // Has timezone info - parse it (might already be in a timezone)
              const parsed = DateTime.fromISO(event.start.dateTime);
              // If it has timezone, keep it; otherwise assume UTC
              startUTC = parsed.isValid ? parsed : DateTime.fromISO(event.start.dateTime, { zone: 'utc' });
            }
            
            if (event.end.dateTime.endsWith('Z')) {
              endUTC = DateTime.fromISO(event.end.dateTime, { zone: 'utc' });
            } else {
              const parsed = DateTime.fromISO(event.end.dateTime);
              endUTC = parsed.isValid ? parsed : DateTime.fromISO(event.end.dateTime, { zone: 'utc' });
            }
            
            // Convert to local timezone
            const startLocal = startUTC.toLocal();
            const endLocal = endUTC.toLocal();
            
            // Format as ISO string WITHOUT timezone (local time)
            // DayPilotCalendar interprets times without timezone as local time
            // Format: YYYY-MM-DDTHH:mm:ss (no timezone suffix)
            start = startLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
            end = endLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
          }
          
          return {
            id: event.id,
            text: event.summary || 'No title',
            start: start,
            end: end,
            allDay: isAllDay,
            // Add color if available from calendar
            backColor: event.colorId ? undefined : '#3c78d8', // Default blue
          };
        }).filter((event: any) => {
          // Filter events to only show those that overlap with today
          if (!event.start) return false;
          
          // Parse event times (already in local timezone from conversion above)
          const eventStart = event.allDay 
            ? DateTime.fromISO(event.start, { zone: 'local' })
            : DateTime.fromISO(event.start);
          const eventEnd = event.end 
            ? (event.allDay 
                ? DateTime.fromISO(event.end, { zone: 'local' })
                : DateTime.fromISO(event.end))
            : eventStart.plus({ days: 1 });
          
          const todayStart = today.startOf('day');
          const todayEnd = today.endOf('day');
          
          // Check if event overlaps with today
          return eventStart <= todayEnd && eventEnd >= todayStart;
        });

        setDayPilotEvents(formattedEvents);
        console.log('Raw events:', rawEvents);
        console.log('Formatted DayPilot events:', formattedEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        setDayPilotEvents([]);
      }
    };
    
    fetchEvents();
    
    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'googleAccessToken') {
        fetchEvents();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event from LoginButton
    const handleAuthChange = () => {
      fetchEvents();
    };
    
    window.addEventListener('googleAuthChange', handleAuthChange);
    
    // Re-fetch periodically when authenticated
    const interval = setInterval(() => {
      if (isAuthenticated()) {
        fetchEvents();
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('googleAuthChange', handleAuthChange);
    };
  }, []);

  console.log('Events:', events);
  console.log('Calendars:', calendars);

  useEffect(() => {
    let denominator = 0;
    if (isPortrait) {
      denominator = 63;
    } else {
      denominator = 52.5;
    }
    const updateDimensions = () => {
      setCellHeight((window.innerHeight-65)/denominator);
    };

    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const config = {
    viewType: "Day" as const,
    startDate: startDate as string,
    headerDateFormat: "ddd M/d/yyyy",
    cellHeight: cellHeight,
    businessBeginsHour: 8,
    businessEndsHour: 24,
    timeRangeSelectedHandling: "Disabled" as const,
    eventMoveHandling: "Disabled" as const,
    eventResizeHandling: "Disabled" as const,
    eventClickHandling: "Disabled" as const,
    // Ensure DayPilotCalendar uses local timezone
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Make event height match cell height
    eventHeight: cellHeight,
    eventOverlapHandling: "Overlap" as const,
  }

  return (
    <Box w="100%" h="100%" position="relative">
      <DayPilotCalendar 
        {...config} 
        events={dayPilotEvents}
      />
      {/* Buttons positioned in DayPilot header area */}
      <Box
        position="absolute"
        top="4px"
        left="8px"
        zIndex={1000}
        display="flex"
        gap={1}
        className="daypilot-header-buttons"
      >
        <LoginButton />
        {isAuthenticated() && (
          <Button bg="gray.200" size="xs" w="24px" h="24px" minW="24px" p={0} onClick={async () => {
            try {
              const calendarsData = await listCalendars();
              console.log('Calendars:', calendarsData);
              setCalendars(calendarsData.items || []);
            } catch (error) {
              console.error('Error fetching calendars:', error);
            }
          }}>
            <Icon as={FaSync} />
          </Button>
        )}
      </Box>
    </Box>
  )
}

/**
 * <DayPilotCalendar
      viewType={"Day"}
      startDate={startDate}
      events={events}
      visible={view === "Day"}
      durationBarVisible={false}
      onTimeRangeSelected={onTimeRangeSelected}
      controlRef={setDayView}
    />  
 */