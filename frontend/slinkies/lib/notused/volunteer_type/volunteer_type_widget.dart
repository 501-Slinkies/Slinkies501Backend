import '/backend/backend.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/forms/create_new_volunteer_type/create_new_volunteer_type_widget.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'volunteer_type_model.dart';
export 'volunteer_type_model.dart';

class VolunteerTypeWidget extends StatefulWidget {
  const VolunteerTypeWidget({
    super.key,
    required this.saveAction,
    this.volunteerTypes,
  });

  final Future Function()? saveAction;
  final OrganizationsRecord? volunteerTypes;

  @override
  State<VolunteerTypeWidget> createState() => _VolunteerTypeWidgetState();
}

class _VolunteerTypeWidgetState extends State<VolunteerTypeWidget> {
  late VolunteerTypeModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => VolunteerTypeModel());

    // On component load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      _model.volunteerTypes =
          widget!.volunteerTypes!.typeOfVolunteering.toList().cast<String>();
      safeSetState(() {});
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      children: [
        Container(
          width: 526.35,
          height: 307.6,
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Row(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Types Of Volunteering',
                    style: FlutterFlowTheme.of(context).titleSmall.override(
                          font: GoogleFonts.inter(
                            fontWeight: FlutterFlowTheme.of(context)
                                .titleSmall
                                .fontWeight,
                            fontStyle: FlutterFlowTheme.of(context)
                                .titleSmall
                                .fontStyle,
                          ),
                          color: FlutterFlowTheme.of(context).primaryText,
                          letterSpacing: 0.0,
                          fontWeight: FlutterFlowTheme.of(context)
                              .titleSmall
                              .fontWeight,
                          fontStyle:
                              FlutterFlowTheme.of(context).titleSmall.fontStyle,
                        ),
                  ),
                  FFButtonWidget(
                    onPressed: () async {
                      _model.addToVolunteerTypes('');
                      safeSetState(() {});
                    },
                    text: '+',
                    options: FFButtonOptions(
                      height: 40.0,
                      padding:
                          EdgeInsetsDirectional.fromSTEB(16.0, 0.0, 16.0, 0.0),
                      iconPadding:
                          EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                      color: FlutterFlowTheme.of(context).primary,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                font: GoogleFonts.inter(
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .titleSmall
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .titleSmall
                                      .fontStyle,
                                ),
                                color: Colors.white,
                                letterSpacing: 0.0,
                                fontWeight: FlutterFlowTheme.of(context)
                                    .titleSmall
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .titleSmall
                                    .fontStyle,
                              ),
                      elevation: 0.0,
                      borderRadius: BorderRadius.circular(8.0),
                    ),
                  ),
                ],
              ),
              Builder(
                builder: (context) {
                  final volunteerTypesList =
                      widget!.volunteerTypes?.typeOfVolunteering?.toList() ??
                          [];

                  return ListView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    scrollDirection: Axis.vertical,
                    itemCount: volunteerTypesList.length,
                    itemBuilder: (context, volunteerTypesListIndex) {
                      final volunteerTypesListItem =
                          volunteerTypesList[volunteerTypesListIndex];
                      return wrapWithModel(
                        model: _model.createNewVolunteerTypeModels.getModel(
                          volunteerTypesListIndex.toString(),
                          volunteerTypesListIndex,
                        ),
                        updateCallback: () => safeSetState(() {}),
                        child: CreateNewVolunteerTypeWidget(
                          key: Key(
                            'Key4rf_${volunteerTypesListIndex.toString()}',
                          ),
                          initialValue: '',
                          deleteAction: () async {
                            _model.removeAtIndexFromVolunteerTypes(
                                volunteerTypesListIndex);
                            safeSetState(() {});
                          },
                          updateAction: (initialValue) async {
                            safeSetState(() {});
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
