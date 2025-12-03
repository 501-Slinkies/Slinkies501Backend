import 'package:flutter/material.dart';
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/backend/api_requests/api_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'flutter_flow/flutter_flow_util.dart';

class FFAppState extends ChangeNotifier {
  static FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal();

  static void reset() {
    _instance = FFAppState._internal();
  }

  Future initializePersistedState() async {}

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  List<MeetingStruct> _meetings = [];
  List<MeetingStruct> get meetings => _meetings;
  set meetings(List<MeetingStruct> value) {
    _meetings = value;
  }

  void addToMeetings(MeetingStruct value) {
    meetings.add(value);
  }

  void removeFromMeetings(MeetingStruct value) {
    meetings.remove(value);
  }

  void removeAtIndexFromMeetings(int index) {
    meetings.removeAt(index);
  }

  void updateMeetingsAtIndex(
    int index,
    MeetingStruct Function(MeetingStruct) updateFn,
  ) {
    meetings[index] = updateFn(_meetings[index]);
  }

  void insertAtIndexInMeetings(int index, MeetingStruct value) {
    meetings.insert(index, value);
  }

  MeetingStruct _currentMeeting = MeetingStruct.fromSerializableMap(
      jsonDecode('{\"sub\":\"Select an event\"}'));
  MeetingStruct get currentMeeting => _currentMeeting;
  set currentMeeting(MeetingStruct value) {
    _currentMeeting = value;
  }

  void updateCurrentMeetingStruct(Function(MeetingStruct) updateFn) {
    updateFn(_currentMeeting);
  }

  MeetingStruct _meetingThatChanged =
      MeetingStruct.fromSerializableMap(jsonDecode('{\"sub\":\"s\"}'));
  MeetingStruct get meetingThatChanged => _meetingThatChanged;
  set meetingThatChanged(MeetingStruct value) {
    _meetingThatChanged = value;
  }

  void updateMeetingThatChangedStruct(Function(MeetingStruct) updateFn) {
    updateFn(_meetingThatChanged);
  }

  /// the spelling on this state cannot be fixed or the whole thing will break.
  List<PeopleStruct> _peoplee = [];
  List<PeopleStruct> get peoplee => _peoplee;
  set peoplee(List<PeopleStruct> value) {
    _peoplee = value;
  }

  void addToPeoplee(PeopleStruct value) {
    peoplee.add(value);
  }

  void removeFromPeoplee(PeopleStruct value) {
    peoplee.remove(value);
  }

  void removeAtIndexFromPeoplee(int index) {
    peoplee.removeAt(index);
  }

  void updatePeopleeAtIndex(
    int index,
    PeopleStruct Function(PeopleStruct) updateFn,
  ) {
    peoplee[index] = updateFn(_peoplee[index]);
  }

  void insertAtIndexInPeoplee(int index, PeopleStruct value) {
    peoplee.insert(index, value);
  }

  int _selectedindex = -1;
  int get selectedindex => _selectedindex;
  set selectedindex(int value) {
    _selectedindex = value;
  }

  List<String> _deletefromlist = [];
  List<String> get deletefromlist => _deletefromlist;
  set deletefromlist(List<String> value) {
    _deletefromlist = value;
  }

  void addToDeletefromlist(String value) {
    deletefromlist.add(value);
  }

  void removeFromDeletefromlist(String value) {
    deletefromlist.remove(value);
  }

  void removeAtIndexFromDeletefromlist(int index) {
    deletefromlist.removeAt(index);
  }

  void updateDeletefromlistAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    deletefromlist[index] = updateFn(_deletefromlist[index]);
  }

  void insertAtIndexInDeletefromlist(int index, String value) {
    deletefromlist.insert(index, value);
  }

  DocumentReference? _userLoggedIn;
  DocumentReference? get userLoggedIn => _userLoggedIn;
  set userLoggedIn(DocumentReference? value) {
    _userLoggedIn = value;
  }

  String _orgID = '';
  String get orgID => _orgID;
  set orgID(String value) {
    _orgID = value;
  }

  String _volunteerID = '';
  String get volunteerID => _volunteerID;
  set volunteerID(String value) {
    _volunteerID = value;
  }

  String _roleView = '';
  String get roleView => _roleView;
  set roleView(String value) {
    _roleView = value;
  }

  List<String> _rolesAvailable = [];
  List<String> get rolesAvailable => _rolesAvailable;
  set rolesAvailable(List<String> value) {
    _rolesAvailable = value;
  }

  void addToRolesAvailable(String value) {
    rolesAvailable.add(value);
  }

  void removeFromRolesAvailable(String value) {
    rolesAvailable.remove(value);
  }

  void removeAtIndexFromRolesAvailable(int index) {
    rolesAvailable.removeAt(index);
  }

  void updateRolesAvailableAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    rolesAvailable[index] = updateFn(_rolesAvailable[index]);
  }

  void insertAtIndexInRolesAvailable(int index, String value) {
    rolesAvailable.insert(index, value);
  }

  String _parentRole = '';
  String get parentRole => _parentRole;
  set parentRole(String value) {
    _parentRole = value;
  }
}
