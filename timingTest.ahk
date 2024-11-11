; Set BPM here
bpm := 60  ; Change this to your desired BPM

; Calculate interval in milliseconds based on BPM
interval := 60000 / bpm

; Define the key to press (change as needed)
keyToPress := "A"  ; Use any key you want, e.g., "Space", "A", "F13", etc.

; Hold duration in milliseconds (adjust if necessary)
holdDuration := 10  ; Change this duration as needed

; Timer to press the key at the specified interval
SetTimer, PressKey, %interval%

; Function to press and hold the key
PressKey:
    ; Press down and hold the key
    SendEvent, {%keyToPress% down}
    Sleep, %holdDuration%  ; Hold the key for the specified duration
    SendEvent, {%keyToPress% up}
return

; Hotkey to start and stop the key pressing
^Space::
    if (A_IsPaused) {
        Pause, Off
        SetTimer, PressKey, On
    } else {
        Pause, On
        SetTimer, PressKey, Off
    }
return
