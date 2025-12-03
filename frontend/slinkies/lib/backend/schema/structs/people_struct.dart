// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class PeopleStruct extends FFFirebaseStruct {
  PeopleStruct({
    String? displayNamee,
    String? id,
    Color? colorr,
    String? photoo,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _displayNamee = displayNamee,
        _id = id,
        _colorr = colorr,
        _photoo = photoo,
        super(firestoreUtilData);

  // "displayNamee" field.
  String? _displayNamee;
  String get displayNamee => _displayNamee ?? '';
  set displayNamee(String? val) => _displayNamee = val;

  bool hasDisplayNamee() => _displayNamee != null;

  // "id" field.
  String? _id;
  String get id => _id ?? '';
  set id(String? val) => _id = val;

  bool hasId() => _id != null;

  // "colorr" field.
  Color? _colorr;
  Color? get colorr => _colorr;
  set colorr(Color? val) => _colorr = val;

  bool hasColorr() => _colorr != null;

  // "photoo" field.
  String? _photoo;
  String get photoo => _photoo ?? '';
  set photoo(String? val) => _photoo = val;

  bool hasPhotoo() => _photoo != null;

  static PeopleStruct fromMap(Map<String, dynamic> data) => PeopleStruct(
        displayNamee: data['displayNamee'] as String?,
        id: data['id'] as String?,
        colorr: getSchemaColor(data['colorr']),
        photoo: data['photoo'] as String?,
      );

  static PeopleStruct? maybeFromMap(dynamic data) =>
      data is Map ? PeopleStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'displayNamee': _displayNamee,
        'id': _id,
        'colorr': _colorr,
        'photoo': _photoo,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'displayNamee': serializeParam(
          _displayNamee,
          ParamType.String,
        ),
        'id': serializeParam(
          _id,
          ParamType.String,
        ),
        'colorr': serializeParam(
          _colorr,
          ParamType.Color,
        ),
        'photoo': serializeParam(
          _photoo,
          ParamType.String,
        ),
      }.withoutNulls;

  static PeopleStruct fromSerializableMap(Map<String, dynamic> data) =>
      PeopleStruct(
        displayNamee: deserializeParam(
          data['displayNamee'],
          ParamType.String,
          false,
        ),
        id: deserializeParam(
          data['id'],
          ParamType.String,
          false,
        ),
        colorr: deserializeParam(
          data['colorr'],
          ParamType.Color,
          false,
        ),
        photoo: deserializeParam(
          data['photoo'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'PeopleStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is PeopleStruct &&
        displayNamee == other.displayNamee &&
        id == other.id &&
        colorr == other.colorr &&
        photoo == other.photoo;
  }

  @override
  int get hashCode =>
      const ListEquality().hash([displayNamee, id, colorr, photoo]);
}

PeopleStruct createPeopleStruct({
  String? displayNamee,
  String? id,
  Color? colorr,
  String? photoo,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    PeopleStruct(
      displayNamee: displayNamee,
      id: id,
      colorr: colorr,
      photoo: photoo,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

PeopleStruct? updatePeopleStruct(
  PeopleStruct? people, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    people
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addPeopleStructData(
  Map<String, dynamic> firestoreData,
  PeopleStruct? people,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (people == null) {
    return;
  }
  if (people.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && people.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final peopleData = getPeopleFirestoreData(people, forFieldValue);
  final nestedData = peopleData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = people.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getPeopleFirestoreData(
  PeopleStruct? people, [
  bool forFieldValue = false,
]) {
  if (people == null) {
    return {};
  }
  final firestoreData = mapToFirestore(people.toMap());

  // Add any Firestore field values
  people.firestoreUtilData.fieldValues.forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getPeopleListFirestoreData(
  List<PeopleStruct>? peoples,
) =>
    peoples?.map((e) => getPeopleFirestoreData(e, true)).toList() ?? [];
