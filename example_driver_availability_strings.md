# Valid Driver Availability String Examples

## Format Requirements
- **Format**: `DHH:MM;DHH:MM;` where:
  - `D` = Day abbreviation (M=Monday, T=Tuesday, W=Wednesday, Th=Thursday, F=Friday)
  - `HH:MM` = Time in 24-hour format
  - Each pair represents a time slot on the same day (start;end)
  - Multiple slots for the same day can be listed sequentially

## Example 1: Driver Available Thursday 10:00-12:00 (matches your ride)
```
Th10:00;Th12:00;
```

## Example 2: Driver with Multiple Time Slots on Thursday
```
Th10:00;Th12:00;Th13:00;Th14:00;
```
This means: Thursday 10:00-12:00 AND Thursday 13:00-14:00

## Example 3: Driver Available Multiple Days with Single Slots
```
M09:00;M12:00;T09:00;T12:00;W09:00;W12:00;Th10:00;Th12:00;F09:00;F12:00;
```
This means:
- Monday: 9:00 AM - 12:00 PM
- Tuesday: 9:00 AM - 12:00 PM
- Wednesday: 9:00 AM - 12:00 PM
- Thursday: 10:00 AM - 12:00 PM
- Friday: 9:00 AM - 12:00 PM

## Example 4: Driver with Multiple Slots Per Day
```
M09:00;M12:00;M13:00;M16:00;T09:00;T12:00;T14:00;T17:00;Th10:00;Th12:00;Th13:00;Th15:00;
```
This means:
- Monday: 9:00-12:00 AND 13:00-16:00
- Tuesday: 9:00-12:00 AND 14:00-17:00
- Thursday: 10:00-12:00 AND 13:00-15:00

## Example 5: Full Week Availability (Most Common)
```
M08:00;M17:00;T08:00;T17:00;W08:00;W17:00;Th08:00;Th17:00;F08:00;F17:00;
```
This means: Available 8:00 AM - 5:00 PM Monday through Friday

## Example 6: Morning Only Availability
```
M08:00;M12:00;T08:00;T12:00;W08:00;W12:00;Th08:00;Th12:00;F08:00;F12:00;
```
This means: Available 8:00 AM - 12:00 PM Monday through Friday

## Example 7: Afternoon Only Availability
```
M13:00;M17:00;T13:00;T17:00;W13:00;W17:00;Th13:00;Th17:00;F13:00;F17:00;
```
This means: Available 1:00 PM - 5:00 PM Monday through Friday

## Example 8: Specific to Match Your Ride (Thursday 10:00-10:50)
```
Th10:00;Th12:00;
```
This will match rides that start at 10:00 AM and end before 12:00 PM on Thursday.

## Example 9: Extended Availability for Thursday
```
Th08:00;Th18:00;
```
This means: Available all day Thursday (8:00 AM - 6:00 PM)

## Example 10: Realistic Part-Time Driver
```
M09:00;M14:00;W09:00;W14:00;Th10:00;Th15:00;
```
This means:
- Monday: 9:00 AM - 2:00 PM
- Wednesday: 9:00 AM - 2:00 PM  
- Thursday: 10:00 AM - 3:00 PM

---

## ❌ Invalid Examples (What NOT to do)

### Invalid: Cross-day pairs
```
F15:00;M12:00;  // ❌ Can't go from Friday to Monday
```

### Invalid: Missing end time
```
Th10:00;  // ❌ No end time
```

### Invalid: Wrong time format
```
Th10;Th12;  // ❌ Missing :MM (minutes)
```

### Invalid: Different days in pair
```
Th10:00;F12:00;  // ❌ Start Thursday, end Friday
```

---

## Notes
- All times must be in 24-hour format (00:00 to 23:59)
- Each day abbreviation must be valid: M, T, W, Th, F
- Start time must be before end time
- Pairs must be on the same day
- You can have multiple slots per day by listing consecutive pairs

