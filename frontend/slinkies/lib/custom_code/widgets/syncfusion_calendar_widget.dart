// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom widgets
import '/custom_code/actions/index.dart'; // Imports custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom widget code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:syncfusion_flutter_calendar/calendar.dart';
import 'dart:core';

class SyncfusionCalendarWidget extends StatefulWidget {
  const SyncfusionCalendarWidget({
    Key? key,
    this.width,
    this.height,
    required this.rebuildpage,
    required this.actionAfterChange,
    this.colorAppBar,
    this.colorbuttonQuickview,
    this.dropdowncolor,
    this.colortextButton,
    this.coloraxis,
    this.colorHeader,
    this.backgroundcolor,
    this.cellBorderColor,
    this.todaycolor,
    required this.apiEventList, // Parameter for API JSON list
  }) : super(key: key);

  final double? width;
  final double? height;
  final Future<dynamic> Function() rebuildpage;
  final Future<dynamic> Function() actionAfterChange;
  final Color? colorAppBar;
  final Color? colorbuttonQuickview;
  final Color? dropdowncolor;
  final Color? colortextButton;
  final Color? coloraxis;
  final Color? colorHeader;
  final Color? backgroundcolor;
  final Color? cellBorderColor;
  final Color? todaycolor;
  final List<dynamic> apiEventList; // Final variable for API JSON list

  @override
  _SyncfusionCalendarWidgetState createState() =>
      _SyncfusionCalendarWidgetState();
}

class _SyncfusionCalendarWidgetState extends State<SyncfusionCalendarWidget> {
  late CalendarController _calendarController;
  late AppointmentDataSource _dataSource;

  // Set default view to Work Week
  CalendarView currentView = CalendarView.workWeek;

  List<CalendarView> availableViews = [
    CalendarView.day,
    CalendarView.week,
    CalendarView.workWeek,
    CalendarView.month,
    CalendarView.timelineDay,
    CalendarView.timelineWeek,
    CalendarView.timelineWorkWeek,
    CalendarView.timelineMonth,
    CalendarView.schedule,
  ];
  @override
  void initState() {
    _calendarController = CalendarController();
    super.initState();
  }

  // 📅 HELPER FUNCTION: MANUALLY parses the M/d/yyyy h:mm a format (FIXED)
  DateTime? _parseCombinedDateTime(String dateString, String timeString) {
    if (dateString.isEmpty || timeString.isEmpty) {
      return null;
    }

    try {
      // 1. Parse Date Component (e.g., "11/5/2025")
      final dateParts = dateString.split('/');
      if (dateParts.length != 3) return null;
      final month = int.parse(dateParts[0]);
      final day = int.parse(dateParts[1]);
      final year = int.parse(dateParts[2]);

      // 2. Parse Time Component (e.g., "6:03 PM")
      final timeParts = timeString.split(' '); // ["6:03", "PM"]
      if (timeParts.length != 2) return null;

      final hourMinute = timeParts[0].split(':'); // ["6", "03"]
      if (hourMinute.length != 2) return null;
      var hour = int.parse(hourMinute[0]);
      final minute = int.parse(hourMinute[1]);
      final ampm = timeParts[1].toUpperCase();

      // 3. Convert 12-hour format to 24-hour format
      if (ampm == 'PM' && hour != 12) {
        hour += 12;
      } else if (ampm == 'AM' && hour == 12) {
        hour = 0; // Midnight case (12 AM is hour 0)
      }

      // 4. Create the final DateTime object
      return DateTime(year, month, day, hour, minute);
    } catch (e) {
      print(
          'Manual DateTime parsing FAILED for: $dateString $timeString. Error: $e');
      return null;
    }
  }

  List<Appointment> getAppointments() {
    print(FFAppState().meetings);
    List<Appointment> meetings = <Appointment>[];

    // 1. --- MAP EXISTING FFAPPSTATE MEETINGS (YOUR ORIGINAL LOGIC) ---
    for (int i = 0; i < FFAppState().meetings.length; i++) {
      final meeting = FFAppState().meetings[i];
      Color color = meeting.col!;
      DateTime start = meeting.start!;
      DateTime end = meeting.end!;
      for (int j = 0; j < FFAppState().peoplee.length; j++) {
        if (FFAppState().peoplee[j].id == meeting.ownerId) {
          color = FFAppState().peoplee[j].colorr ?? color;
        }
      }
      List<String>? resourceIds;
      if (meeting.ownerId.isEmpty) {
        resourceIds = ['0'];
      } else {
        resourceIds = [meeting.ownerId];
      }
      if (meeting.repeat) {
        RecurrenceProperties recurrence =
            RecurrenceProperties(startDate: DateTime.now());
        recurrence.recurrenceType = RecurrenceType.daily;
        recurrence.interval = meeting.interval;
        recurrence.recurrenceRange = RecurrenceRange.count;
        recurrence.recurrenceCount = meeting.count;
        meetings.add(Appointment(
          startTime: start,
          id: meeting.id,
          endTime: end,
          subject: meeting.sub,
          color: color,
          resourceIds: resourceIds,
          recurrenceExceptionDates: <DateTime>[DateTime(2023, 12, 11)],
          recurrenceRule: SfCalendar.generateRRule(recurrence, DateTime.now(),
              DateTime.now().add(Duration(hours: 2))),
        ));
      } else {
        meetings.add(Appointment(
            startTime: start,
            endTime: end,
            id: meeting.id,
            subject: meeting.sub,
            color: color,
            recurrenceRule: null,
            resourceIds: resourceIds));
      }
    }

    // 2. --- MAP NEW API EVENTS FROM JSON LIST ---
    for (final event in widget.apiEventList) {
      try {
        // **JSON PATH MAPPING & NULL CHECKING**
        final String rideId =
            event['ride_id'] as String? ?? 'N/A'; // Ensure this key is correct!
        final String dateString = event['date'] as String? ?? '';

        final String? appointmentTimeString =
            event['appointmentTime'] as String?;
        final String? pickupTimeString = event['pickupTime'] as String?;

        final String timeString =
            appointmentTimeString ?? pickupTimeString ?? '';

        if (dateString.isEmpty || timeString.isEmpty) {
          print(
              'Skipping API event $rideId: Date or Time is null/empty. Date: $dateString, Time: $timeString');
          continue;
        }

        final String appointmentType =
            event['appointment_type'] as String? ?? 'Ride';
        final String status = event['status'] as String? ?? 'Unknown';

        DateTime? startTime = _parseCombinedDateTime(dateString, timeString);

        if (startTime == null) {
          print(
              'Skipping API event $rideId: Failed to parse date/time from "$dateString $timeString".');
          continue;
        }

        DateTime endTime = startTime.add(const Duration(hours: 1));

        // --- DETAILED SUBJECT LINE LOGIC ---

        final String clientLastName =
            event['clientLastName'] as String? ?? 'N/A Client';
        final String dispatcherLastName =
            event['dispatcherLastName'] as String? ?? 'N/A Dispatcher';

        final String? driverLastNameRaw = event['driverLastName'] as String?;
        final String driverStatus =
            driverLastNameRaw != null && driverLastNameRaw.isNotEmpty
                ? 'Driver: $driverLastNameRaw'
                : 'Unassigned';

        final String subjectTitle =
            'Client: $clientLastName | Dispatcher: $dispatcherLastName | $driverStatus';

        // --- COLOR MAPPING LOGIC (Strictly Follows User Legend) ---

        Color eventColor;

        if (status.contains('Assigned')) {
          // Assigned: hex #258232 (Green)
          eventColor = const Color(0xFF258232);
        } else if (status.contains('Unassigned')) {
          // Unassigned: hex #5e87ae (Grey-Blue)
          eventColor = const Color(0xFF5E87AE);
        } else if (status.contains('Cancelled')) {
          // Cancelled: hex #ac3931 (Red)
          eventColor = const Color(0xFFAC3931);
        } else if (status.contains('Complete')) {
          // Complete: hex #0075ff (Bright Blue)
          eventColor = const Color(0xFF0075FF);
        } else {
          // Default to black if status is missing or unknown
          eventColor = const Color(0xFF000000);
        }

        // Add the API event
        meetings.add(Appointment(
          id: rideId,
          subject: subjectTitle, // Applied the detailed subject
          startTime: startTime,
          endTime: endTime,
          color: eventColor, // Applied the new status color
          isAllDay: false,
          resourceIds: ['API_RIDE_GROUP'],
        ));
      } catch (e) {
        print('Error mapping API event: $e for data: $event');
      }
    }

    return meetings;
  }

  // 👆 HANDLER: Triggers when an appointment is tapped (for show bottom sheet)
  Future<void> _handleCalendarTap(CalendarTapDetails details) async {
    if (details.targetElement == CalendarElement.appointment ||
        details.targetElement == CalendarElement.agenda) {
      if (details.appointments == null || details.appointments!.isEmpty) {
        return;
      }

      final Appointment appointment = details.appointments!.first;
      final String? appointmentIdString = appointment.id?.toString();

      if (appointmentIdString == null ||
          appointmentIdString.isEmpty ||
          appointmentIdString == 'N/A') {
        print('Error: Appointment ID is null or invalid on tap.');
        return;
      }

      // 1. Create the DocumentReference object from the string ID
      const String firestoreCollectionName = 'rides';
      final DocumentReference rideRef = FirebaseFirestore.instance
          .collection(firestoreCollectionName)
          .doc(appointmentIdString);

      // --- Update FFAppState ---
      FFAppState().currentMeeting.sub = appointment.subject ?? 'No Subject';
      FFAppState().currentMeeting.end = appointment.endTime;
      FFAppState().currentMeeting.start = appointment.startTime;
      FFAppState().currentMeeting.col = appointment.color;

      // 🎯 Set FFAppState().currentMeeting.id to the DocumentReference object 🎯
      FFAppState().currentMeeting.id = rideRef;

      FFAppState().currentMeeting.ownerId = (appointment.resourceIds != null &&
              appointment.resourceIds!.isNotEmpty)
          ? appointment.resourceIds![0].toString()
          : '0';

      await widget
          .actionAfterChange(); // Triggers the FF Show Bottom Sheet Action
    }
  }

  @override
  Widget build(BuildContext context) {
    // Use a key to force the calendar to redraw if the data list changes
    final Key calendarKey = ValueKey(widget.apiEventList.length);

    _dataSource =
        AppointmentDataSource(getAppointments(), getResourcesWithEvents());
    return Scaffold(
        appBar: AppBar(
          title: Text('Calendar, ${FFAppState().currentMeeting.sub}'),
          backgroundColor:
              widget.colorAppBar ?? const Color.fromARGB(220, 248, 59, 69),
          actions: [
            DropdownButton<CalendarView>(
              value: currentView,
              dropdownColor: widget.dropdowncolor ?? Colors.black,
              onChanged: (CalendarView? newValue) {
                if (newValue != null) {
                  setState(() {
                    currentView = newValue;
                    _calendarController.view = currentView;
                  });
                }
              },
              items: [
                for (var view in availableViews)
                  DropdownMenuItem(
                    value: view,
                    child: Text(
                      view.toString().split('.')[1],
                      style: TextStyle(
                        color: widget.colortextButton ?? Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            ElevatedButton(
              onPressed: () {
                _showQuickViewNavigationDialog(context);
              },
              child: const Text('Quick View'),
              style: ButtonStyle(
                backgroundColor: MaterialStateProperty.all(
                    widget.colorbuttonQuickview ?? Colors.blue),
              ),
            ),
          ],
        ),
        body: SfCalendar(
          key: calendarKey, // Use the key here
          monthViewSettings: MonthViewSettings(
              showAgenda: true,
              monthCellStyle: MonthCellStyle(
                  textStyle: TextStyle(color: widget.coloraxis ?? Colors.grey),
                  leadingDatesTextStyle:
                      TextStyle(color: widget.coloraxis ?? Colors.grey),
                  trailingDatesTextStyle:
                      TextStyle(color: widget.coloraxis ?? Colors.grey)),
              agendaStyle: AgendaStyle(
                  dayTextStyle:
                      TextStyle(color: widget.coloraxis ?? Colors.grey),
                  dateTextStyle:
                      TextStyle(color: widget.coloraxis ?? Colors.grey),
                  appointmentTextStyle:
                      TextStyle(color: widget.coloraxis ?? Colors.grey))),
          headerStyle: CalendarHeaderStyle(
              textStyle: TextStyle(color: widget.colorHeader ?? Colors.white)),
          viewHeaderStyle: ViewHeaderStyle(
              dayTextStyle: TextStyle(color: widget.coloraxis ?? Colors.grey),
              dateTextStyle: TextStyle(color: widget.coloraxis ?? Colors.grey)),
          timeSlotViewSettings: TimeSlotViewSettings(
            startHour: 6,
            endHour: 23,
            timeTextStyle: TextStyle(color: widget.coloraxis ?? Colors.grey),
          ),
          scheduleViewSettings: ScheduleViewSettings(
            appointmentTextStyle:
                TextStyle(color: widget.coloraxis ?? Colors.grey),
            dayHeaderSettings: DayHeaderSettings(
                dateTextStyle:
                    TextStyle(color: widget.coloraxis ?? Colors.grey),
                dayTextStyle:
                    TextStyle(color: widget.coloraxis ?? Colors.grey)),
            monthHeaderSettings: MonthHeaderSettings(
                monthTextStyle:
                    TextStyle(color: widget.coloraxis ?? Colors.grey)),
            weekHeaderSettings: WeekHeaderSettings(
                weekTextStyle:
                    TextStyle(color: widget.coloraxis ?? Colors.grey)),
          ),
          resourceViewSettings: ResourceViewSettings(
              displayNameTextStyle: TextStyle(
            color: widget.colorHeader ?? Colors.white,
          )),
          backgroundColor: widget.backgroundcolor ?? Colors.black,
          cellBorderColor: widget.cellBorderColor ?? Colors.grey,
          todayHighlightColor: widget.todaycolor ?? Colors.red,
          controller: _calendarController,
          firstDayOfWeek: 6,
          dataSource: _dataSource,
          view: currentView,

          onTap: _handleCalendarTap, // Tap to show bottom sheet

          onLongPress: (CalendarLongPressDetails details) async {
            if (details.targetElement == CalendarElement.appointment ||
                details.targetElement == CalendarElement.agenda) {
              if (details.appointments == null ||
                  details.appointments!.isEmpty) {
                return;
              }
              final Appointment appointment = details.appointments!.first;
              final String? appointmentIdString = appointment.id?.toString();

              if (appointmentIdString == null ||
                  appointmentIdString.isEmpty ||
                  appointmentIdString == 'N/A') {
                print(
                    'Error: Appointment ID is null or invalid on long press.');
                return;
              }

              // Create Document Reference for Long Press too
              const String firestoreCollectionName = 'rides';
              final DocumentReference rideRef = FirebaseFirestore.instance
                  .collection(firestoreCollectionName)
                  .doc(appointmentIdString);

              FFAppState().currentMeeting.sub =
                  appointment.subject ?? 'No Subject';
              FFAppState().currentMeeting.end = appointment.endTime;
              FFAppState().currentMeeting.start = appointment.startTime;
              FFAppState().currentMeeting.col = appointment.color;

              // Store the DocumentReference object
              FFAppState().currentMeeting.id = rideRef;

              FFAppState().currentMeeting.ownerId =
                  (appointment.resourceIds != null &&
                          appointment.resourceIds!.isNotEmpty)
                      ? appointment.resourceIds![0].toString()
                      : '0';

              await widget.rebuildpage(); // Rebuilds the page after long press
            }
          },
        ));
  }

  void _showQuickViewNavigationDialog(BuildContext context) async {
    DateTime currentDate = DateTime.now();
    DateTime? selectedDate = await showDatePicker(
      context: context,
      initialDate: currentDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );

    if (selectedDate != null && selectedDate != currentDate) {
      setState(() {
        _calendarController.displayDate = selectedDate;
      });
    }
  }

  List<CalendarResource> getResourcesWithEvents() {
    List<CalendarResource> resourcesWithEvents = <CalendarResource>[];

    for (int i = 0; i < FFAppState().peoplee.length; i++) {
      final people = FFAppState().peoplee[i];

      bool hasAppStateEvent =
          FFAppState().meetings.any((meeting) => meeting.ownerId == people.id);

      ImageProvider<Object>? imageProvider =
          people.photoo.isNotEmpty ? NetworkImage(people.photoo) : null;

      if (hasAppStateEvent) {
        resourcesWithEvents.add(CalendarResource(
          displayName: people.displayNamee,
          id: people.id,
          color: people.colorr!,
          image: imageProvider,
        ));
      }
    }

    // Add a resource for the API rides group
    if (widget.apiEventList.isNotEmpty) {
      resourcesWithEvents.add(CalendarResource(
        displayName: "API Rides",
        id: 'API_RIDE_GROUP', // MUST match the ID used in getAppointments()
        color: Colors.lightBlue.shade700,
      ));
    }

    return resourcesWithEvents;
  }
}

class AppointmentDataSource extends CalendarDataSource {
  AppointmentDataSource(
      List<Appointment> source, List<CalendarResource> resourceColl) {
    appointments = source;
    resources = resourceColl;
  }
}
