// TODO: This needs to take in parameters to update note patterns compatible with the lanes time signature
export function getLaneEditingHTML(id: string, bpm: number, measureCount: number, hitsound: string, metronomeSound: string): string {
    return `    
    <div class="lane_editing">
        <div id="metronome_container">
            <button class="metronome_button" id="${id}_metronome_button">
            <!-- TODO: Get better svg for this -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-music"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
            </button>
            <label id="${id}_metronome_paragraph">Metronome disabled</label>
        </div>  

        <div class="bpm_container">
            <input id="${id}_bpm_input" class="bpm_input" type="number" min="1" value="${bpm}">
            <label>BPM</label>
        </div>

        <div class="measure_count_container">
            <input id="${id}_measure_count_input" class="measure_count_input" type="number" min="1" value="${measureCount}">
            <label>measure count</label>
        </div>

        <div class="lane_sound_container">
            <select class="lane_sound_select" id="${id}_hitsound_select">
                <option value="kick" ${hitsound == 'kick' ? 'selected' : ''}>kick</option>
                <option value="snare" ${hitsound == 'snare' ? 'selected' : ''}>snare</option>
                <option value="clap" ${hitsound == 'clap' ? 'selected' : ''}>clap</option>
                <option value="crash" ${hitsound == 'crash' ? 'selected' : ''}>crash</option>
                <option value="open-hihat" ${hitsound == 'open-hihat' ? 'selected' : ''}>open-hihat</option>
                <option value="closed-hihat" ${hitsound == 'closed-hihat' ? 'selected' : ''}>closed-hihat</option>
            </select>
            <label for="lane_sound_select">Lane sound</label>
        </div>

        <div class="metronome_sound_container">
            <select class="metronome_select" id="${id}_metronome_select">
                <option value="metronome1" ${metronomeSound == 'metronome1' ? 'selected' : ''}>metronome1</option>
                <option value="metronome2" ${metronomeSound == 'metronome2' ? 'selected' : ''}>metronome2</option>
                <option value="metronome3" ${metronomeSound == 'metronome3' ? 'selected' : ''}>metronome3</option>
                <option value="metronome4" ${metronomeSound == 'metronome4' ? 'selected' : ''}>metronome4</option>
                <option value="metronome5" ${metronomeSound == 'metronome5' ? 'selected' : ''}>metronome5</option>
                <option value="metronome6" ${metronomeSound == 'metronome6' ? 'selected' : ''}>metronome6</option>
            </select>
            <label for="lane_sound_select">Metronome sound</label>
        </div>

        <div class="time_signature_container">
            <select id="${id}_time_signature_select" class="time_signature_select">
                <option value="4/4">4/4</option>
                <option value="2/4">2/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
            </select>
            <label for="lane_sound_select">Time signature</label>
        </div>

        <!-- TODO: Ctrl + z | ctrl + y implementation -->
        <button class="clear_notes" id="${id}_clear_notes_button">clear notes</button>

        <div class="pattern_loading_container">
            <select class="load_notes_select">
                <option value="kick">Pattern_1</option>
                <option value="snare">Pattern_2</option>
                <option value="clap">Pattern_3</option>
                <option value="crash">Pattern_4</option>
                <option value="open-hihat">Pattern_5</option>
                <option value="closed-hihat">Pattern_6</option>
            </select>
            <button class="load_notes">Load note pattern</button>
        </div>

        <button id=${id}_back_to_start>back to start</button>

        <button id=${id}_close>close</button>


        <p>right click to delete</p>
    </div>
    `;
}

