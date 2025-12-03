import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'total_hours_text_field_widget.dart' show TotalHoursTextFieldWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class TotalHoursTextFieldModel
    extends FlutterFlowModel<TotalHoursTextFieldWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for totalHours widget.
  FocusNode? totalHoursFocusNode;
  TextEditingController? totalHoursTextController;
  String? Function(BuildContext, String?)? totalHoursTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    totalHoursFocusNode?.dispose();
    totalHoursTextController?.dispose();
  }
}
