package no.nks.service;

import java.time.LocalDateTime;

/**
 * Service for creating calendar event (.ics) files.
 */
public interface CalendarService {

    /**
     * Creates an iCalendar (.ics) event file as a byte array.
     *
     * @param startDateTime The start date and time of the event.
     * @param summary       The summary or title of the event.
     * @param description   The detailed description of the event.
     * @return A byte array representing the .ics file.
     * @throws Exception if there is an error creating the calendar event.
     */
    byte[] createCalendarEvent(LocalDateTime startDateTime, String summary, String description) throws Exception;
}
