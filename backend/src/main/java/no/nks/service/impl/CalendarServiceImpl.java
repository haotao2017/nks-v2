package no.nks.service.impl;

import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.DateTime;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.CalScale;
import net.fortuna.ical4j.model.property.Description;
import net.fortuna.ical4j.model.property.ProdId;
import net.fortuna.ical4j.model.property.Uid;
import net.fortuna.ical4j.model.property.Version;
import net.fortuna.ical4j.util.RandomUidGenerator;
import net.fortuna.ical4j.util.UidGenerator;
import no.nks.service.CalendarService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.GregorianCalendar;
import net.fortuna.ical4j.data.CalendarOutputter;


@Service
public class CalendarServiceImpl implements CalendarService {

    @Override
    public byte[] createCalendarEvent(LocalDateTime startDateTime, String summary, String description) throws Exception {
        // Convert LocalDateTime to iCal4j DateTime
        java.util.Calendar calendarTime = GregorianCalendar.from(startDateTime.atZone(ZoneId.systemDefault()));
        DateTime start = new DateTime(calendarTime.getTime());

        // Create the event
        VEvent event = new VEvent(start, summary);

        // Add a UID
        UidGenerator ug = new RandomUidGenerator();
        Uid uid = ug.generateUid();
        event.getProperties().add(uid);

        // Add description
        if (description != null && !description.isEmpty()) {
            event.getProperties().add(new Description(description));
        }

        // Create a calendar
        Calendar calendar = new Calendar();
        calendar.getProperties().add(new ProdId("-//NBK System//iCal4j 1.0//EN"));
        calendar.getProperties().add(Version.VERSION_2_0);
        calendar.getProperties().add(CalScale.GREGORIAN);

        // Add the event to the calendar
        calendar.getComponents().add(event);

        // Output the calendar to a byte array
        ByteArrayOutputStream bout = new ByteArrayOutputStream();
        CalendarOutputter outputter = new CalendarOutputter();
        outputter.output(calendar, bout);

        return bout.toByteArray();
    }
}
