import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'total_miles_textfield_widget.dart' show TotalMilesTextfieldWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class TotalMilesTextfieldModel
    extends FlutterFlowModel<TotalMilesTextfieldWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for totalMiles widget.
  FocusNode? totalMilesFocusNode;
  TextEditingController? totalMilesTextController;
  String? Function(BuildContext, String?)? totalMilesTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    totalMilesFocusNode?.dispose();
    totalMilesTextController?.dispose();
  }
}
