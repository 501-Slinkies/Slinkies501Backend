import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/forms/create_new_volunteer_type/create_new_volunteer_type_widget.dart';
import 'dart:ui';
import 'volunteer_type_widget.dart' show VolunteerTypeWidget;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class VolunteerTypeModel extends FlutterFlowModel<VolunteerTypeWidget> {
  ///  Local state fields for this component.

  List<String> volunteerTypes = [];
  void addToVolunteerTypes(String item) => volunteerTypes.add(item);
  void removeFromVolunteerTypes(String item) => volunteerTypes.remove(item);
  void removeAtIndexFromVolunteerTypes(int index) =>
      volunteerTypes.removeAt(index);
  void insertAtIndexInVolunteerTypes(int index, String item) =>
      volunteerTypes.insert(index, item);
  void updateVolunteerTypesAtIndex(int index, Function(String) updateFn) =>
      volunteerTypes[index] = updateFn(volunteerTypes[index]);

  ///  State fields for stateful widgets in this component.

  // Models for create_new_volunteer_type dynamic component.
  late FlutterFlowDynamicModels<CreateNewVolunteerTypeModel>
      createNewVolunteerTypeModels;

  @override
  void initState(BuildContext context) {
    createNewVolunteerTypeModels =
        FlutterFlowDynamicModels(() => CreateNewVolunteerTypeModel());
  }

  @override
  void dispose() {
    createNewVolunteerTypeModels.dispose();
  }
}
