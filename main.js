// var context

let SynthChannel
SynthChannel = class {
    constructor() {
        this.waveform = 'sawtooth'
        this.currentFreq = 0.0
        this.cutoff = 1.5;
        this.peak = 18

        this.detune = 4
        this.subOscWeight = 0

        this.source = null
        this.subOsc = null
        this.som = null
        this.vf = null
        this.filter = null
    }

    setFilter(at) {
        this.filter.frequency.setValueAtTime(this.currentFreq * this.cutoff, at)
    }

    setPeak(at = SynthChannel.context.currentTime) {
        this.filter.Q.setValueAtTime(this.peak, at)
    }

    setWaveform() {
        let tmp = this.masterVolume.gain.value
        this.masterVolume.gain.setValueAtTime(0, SynthChannel.context.currentTime + .1)
        this.source.type = this.waveform
        this.masterVolume.gain.setValueAtTime(tmp, SynthChannel.context.currentTime + .1)
    }

    setDetune(at) {
      let sf = Math.pow(2, this.detune / 12.0) * this.currentFreq
      console.debug("Sub osc " + sf)
      this.subOsc.frequency.setValueAtTime(sf, at)
      this.subOscGain.gain.setValueAtTime(this.subOscWeight, at)
    }

    noteOn(freq, oct, at = SynthChannel.context.currentTime) {
      this.vf.gain.cancelAndHoldAtTime(at)
      this.vf.gain.setValueAtTime(.0, at)

      console.debug(freq, oct)
      this.currentFreq = freq * Math.pow(2, oct - 4)
      console.debug("Note on " + this.currentFreq)

      this.source.frequency.setValueAtTime(this.currentFreq, at)
      this.setDetune(at)
      this.setFilter(at)

      this.vf.gain.linearRampToValueAtTime(1.0, at + .01) // Attack
      this.vf.gain.linearRampToValueAtTime(.8, at + .5) // decay
      this.vf.gain.linearRampToValueAtTime(0.0, at + 3) // sustain
    }

    noteOff(at = SynthChannel.context.currentTime) {
      this.vf.gain.linearRampToValueAtTime(0.0, at + .6) // release

      // TODO ここにviewが混ざってしまってる
      var ks = document.getElementsByClassName('noteon')
      for (let i of ks) {
        i.classList.remove(["noteon"])
      }
    }

    start() {
        this.source = SynthChannel.context.createOscillator()
        let now = SynthChannel.context.currentTime;
        this.source.frequency.setValueAtTime(440, now)

        this.subOsc = SynthChannel.context.createOscillator()
        this.subOsc.type = 'square'
        this.subOscGain = SynthChannel.context.createGain()

        this.som = SynthChannel.context.createChannelMerger(2)

        this.vf = SynthChannel.context.createGain()
        this.vf.gain.setValueAtTime(0, now)

        this.filter = SynthChannel.context.createBiquadFilter()
        this.filter.type = 'lowpass'
        this.filter.frequency.setValueAtTime(330, now)
        // filter.frequency.setValueAtTime(0, context.currentTime)
        this.setPeak()

        this.masterVolume = SynthChannel.context.createGain()
        this.masterVolume.gain.setValueAtTime(0.6, now)

        this.source.connect(this.som)
        this.subOsc.connect(this.subOscGain)
        this.subOscGain.connect(this.som)

        this.som.connect(this.vf)
        this.vf.connect(this.filter)
        this.filter.connect(this.masterVolume)
        this.masterVolume.connect(SynthChannel.context.destination)

        this.setWaveform()

        this.source.start()
        this.subOsc.start()
    }

};

var freqTable = {
    "c": 261.626,    // C
    "c#": 277.183,
    "d": 293.665,    // D
    "d#": 311.127,
    "e": 329.628,    // E
    "f": 349.228,    // F
    "f#": 369.994,
    "g": 391.995,    // G
    "g#": 415.305,
    "a": 440.000,    // A
    "a#": 466.164,
    "b": 493.883,    // B
}

window.addEventListener('load', init, false)
var currentCh = null;

function init() {
    try {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        SynthChannel.context = new AudioContext();
        currentCh = new SynthChannel()
    }
    catch (e) {
        console.error(e)
    }
}

function shortcutKeyProc(e) {
    if (e.repeat) {
        return
    }

    // sub osc
    let now = SynthChannel.context.currentTime
    switch (e.key) {
        case '1':
            if (subOscWeight < 1.0) {
                subOscWeight += .1
                currentCh.setDetune(now)
                document.getElementById('synth-subosc').value = subOscWeight
            }
            return
        case 'q':
            if (subOscWeight > 0.1) {
                subOscWeight -= .1
                currentCh.setDetune(now)
                document.getElementById('synth-subosc').value = subOscWeight
            }
            return
    }
    // detune
    switch (e.key) {
        case '2':
            if (detune < 12) {
                detune += 1
                currentCh.setDetune(now)
                // document.getElementById('synth-detune').value = detune
            }
            return
        case 'w':
            if (detune > -12) {
                detune -= 1
                currentCh.setDetune(now)
                // document.getElementById('synth-detune').value = detune
            }
            return
    }

    // cutoff
    switch (e.key) {
        case 'e':
            if (cutoff > 0.1) {
                cutoff -= 0.1
                console.debug(cutoff)
                currentCh.setFilter(now)
                document.getElementById('synth-cutoff').value = cutoff
            }
            return
        case '3':
            if (cutoff < 4.0) {
                cutoff += 0.1
                console.debug(cutoff)
                currentCh.setFilter(now)
                document.getElementById('synth-cutoff').value = cutoff
            }
            return
    }

    // peak
    switch (e.key) {
        case 'r':
            if (peak > 3) {
                peak -= 3
                console.debug(peak)
                currentCh.setPeak()
                document.getElementById('synth-peak').value = peak
            }
            return
        case '4':
            if (peak < 36) {
                peak += 3
                console.debug(peak)
                currentCh.setPeak()
                document.getElementById('synth-peak').value = peak
            }
            return
    }

    // piano keys
    var o = parseInt(document.getElementById('play-octave').value)
    var n = ''
    switch (e.key) {
        case 'z':
            n = 'b'
            o -= 1
            break
        case 'x':
            n = 'c'
            break
        case 'c':
            n = 'd'
            break
        case 'v':
            n = 'e'
            break
        case 'b':
            n = 'f'
            break
        case 'n':
            n = 'g'
            break
        case 'm':
            n = 'a'
            break
        case ',':
            n = 'b'
            break
        case '.':
            n = 'c'
            o += 1
            break
        case '/':
            n = 'd'
            o += 1
            break
        case 'd':
            n = 'c#'
            break
        case 'f':
            n = 'd#'
            break
        case 'h':
            n = 'f#'
            break
        case 'j':
            n = 'g#'
            break
        case 'k':
            n = 'a#'
            break
        case ';':
            n = 'c#'
            o += 1
            break
        case "'":
            n = 'd#'
            o += 1
            break

        default:
            console.debug("Other key:" + e.key)
            return
    }
    let f = freqTable[n]  // これはどーなのかな
    currentCh.noteOn(f, o)
    document.querySelector('.key.note-' + n + '.octave-' + o).classList.add('noteon')
}

function keyup(e) {
    if (currentCh) {
        currentCh.noteOff()
    }
}

window.addEventListener("keydown", shortcutKeyProc, false)
window.addEventListener("keyup", keyup, false)

function clickKeyProc(e) {
    let cl = e.target.classList;
    if (cl.contains("key")) {
        var ns = null
        var o = 0
        cl.forEach(function (v,k, _) {
            if (v.startsWith('note-')) {
                console.debug(v)
                ns = v.substr(5)
            } else if (v.startsWith('octave-')) {
                console.debug(v)
                o = parseInt(v.substr(7)) - 4
            }
        })
        let os = parseInt(document.getElementById('play-octave').value) + o

        currentCh.noteOn(freqTable[ns], os)
        cl.add("noteon")
    }
}

function noteOffKeyProc(e) {
  currentCh.noteOff()
}

function waveSelectChanged(e) {
    console.debug(e)

    let w = e.target.getAttribute('value')
    waveform = w
    currentCh.setWaveform()
}

function meterControl(proc, e) {
    let min;
    let max;
    let v;
    let tgt;

    switch (e.type) {
        case "wheel":
            tgt = e.target;

            v = Number(tgt.value)
            max = Number(tgt.max)
            min = Number(tgt.min)
            let step = (max - min) / -1250.0 * e.deltaY
            if (e.shiftKey) {
                step /= 8
            }
            v += step
            if (v < min) {
                v = min
            } else if (v > max) {
                v = max
            }
            break

        case "mousemove":
            if ((e.buttons & 1) == 0) {
                return
            }
            // fall through
        case "mousedown":
            console.debug(e)
            tgt = e.target
            max = Number(tgt.max)
            min = Number(tgt.min)
            v = min + (max - min) * e.offsetX / e.target.clientWidth
            break

        default:
            return
    }
    tgt.value = v
    proc.call(null, v)
}

function addMeterEventListener(elem, afterProc) {
    let proc = meterControl.bind(null, afterProc)
    if (typeof elem === 'string') {
        elem = document.getElementById(elem)
    }
    elem.addEventListener("wheel",  proc)
    elem.addEventListener("mousedown",  proc)
    elem.addEventListener("mousemove",  proc)
}

document.addEventListener('DOMContentLoaded',function() {
    let prepBtn = document.querySelector('#prepare')
    let prepProp =     function () {
        SynthChannel.context.resume().then(function () {
            console.debug('Context resumed')
            prepBtn.removeEventListener('click', prepProp)
            currentCh.start()
            prepBtn.style.display = 'none'
        }).catch(function (reason) {
            console.warn('Fail to resume context' + reason)
        })
    }
    prepBtn.addEventListener('click', prepProp)

    document.querySelectorAll('.psudo-drop').forEach(
        function (value, key, parent) {
            value.addEventListener("change", waveSelectChanged)
        }
    )
    let kbElem = document.querySelector("#keyboard")
    kbElem.addEventListener("mousedown", clickKeyProc, false)
    kbElem.addEventListener("mouseup", noteOffKeyProc, false)

    addMeterEventListener('synth-detune',function (v) {
        console.debug(v)
        currentCh.detune = v
        currentCh.setDetune(SynthChannel.context.currentTime)
    })
    addMeterEventListener('synth-subosc', function (v) {
        currentCh.subOscWeight = v
        currentCh.setDetune(SynthChannel.context.currentTime)
    })
    addMeterEventListener('synth-cutoff', function (v) {
        cutoff = v
        currentCh.setFilter(SynthChannel.context.currentTime)
    })
    addMeterEventListener('synth-peak', function (v) {
        peak = v
        currentCh.setPeak(SynthChannel.context.currentTime)
    })
    document.getElementById('synth-wave').addEventListener('click', function (e) {
        let tgt = e.target.closest('.psudo-drop');
        let pushed = e.target.closest('button')
        let inner = tgt.querySelector('ul');

        if (tgt.classList.contains('selecting')) {
            // 選択->決定
            let sel = pushed.dataset['index']
            inner.style.top = -20 * sel + "px"
            inner.style.left = '0px'
            inner.style.position = 'relative'
            tgt.classList.remove('selecting')

            tgt.setAttribute('value', pushed.value)
            let evt = new Event('change')
            tgt.dispatchEvent(evt)
            // waveSelectChanged(pushed)
        } else {
            // 通常->選択
            tgt.classList.add('selecting')
            let cl = inner.getBoundingClientRect();
            inner.style.position = 'absolute'
            inner.style.top = Math.max(0, cl.top) + 'px'
            inner.style.left = cl.left + 'px'

        }
    })

    let playHandle
    document.querySelector('#play label.play-check>input').addEventListener('change', function (e) {
        let checked = e.target.checked;

        let te = document.querySelector('input#play-tempo')
        let note_tick = 60 / (0 + te.value) / 4
        let interval = Math.max(note_tick * 250, 10)

        let start_time = 0

        if (checked) {
            var note_index = 0
            start_time = SynthChannel.context.currentTime
            var last_changed_time = start_time
            playHandle = setInterval(function () {
                // 音の予約
                // 過去の最終note_changeから、現在時+interval*2までのnote_changeを予約
                // 時間範囲の計算
                let now = SynthChannel.context.currentTime
                let range_end = now + interval / 200    // interval(mSec) * 5 / 1000

                // 時間範囲内のnote_changeを列挙
                // TODO start_timeから計算するとテンポ変更時に大変なので、せめて小節先頭時刻とかにする
                let s_off = Math.trunc((last_changed_time - start_time) / note_tick)
                let e_off = Math.trunc((range_end - start_time) / note_tick)
                while (s_off < e_off) {
                    let n = notes[s_off % 16]
                    if (n) {
                        // note_changeの予約
                        let oct = n >> 4
                        let note = [
                            "c",
                            "c#",
                            "d",
                            "d#",
                            "e",
                            "f",
                            "f#",
                            "g",
                            "g#",
                            "a",
                            "a#",
                            "b",
                        ][n & 0xf]

                        let at = s_off * note_tick + start_time;
                        console.debug(note, at)
                        let freq = freqTable[note];
                        currentCh.noteOn(freq, oct, at)
                        currentCh.noteOff(at + note_tick)
                        currentCh.noteOff(at + note_tick)
                    }
                    s_off += 1
                }
                last_changed_time = range_end

                let cgs = '#matrix colgroup.measure col.note'+ note_index
                let cg = document.querySelector(cgs)
                if (cg) {
                    cg.classList.remove('current')
                }
                let v0 = (now - start_time) / note_tick
                note_index = (Math.trunc(v0) % 16) + 1
                let cgs2 = document.querySelector('#matrix colgroup.measure col.note'+ note_index);
                if (cgs2) {
                    cgs2.classList.add('current')
                }
            }, interval)
        } else {
            if (playHandle) {
                clearInterval(playHandle)
                document.querySelectorAll('#matrix colgroup.mesure col').forEach(function (v, ix) {
                    v.classList.remove('current')
                })
                note_index = 0
                currentCh.noteOff()
            }
        }
    })

    let notes = []
    document.querySelector('#matrix tbody').addEventListener('click', function (e) {
        let step = e.target.cellIndex - 1
        let nix = e.target.closest('tr').dataset['note']

        let note = parseInt(nix, 16)
        console.log(note)

        if (notes[step]) {
            let qs = '#matrix tbody tr td:nth-child(' + (step + 2) + ').on'
            document.querySelectorAll(qs).forEach(function (v) {
                v.classList.remove('on')
            })
        }

        if (notes[step] == note) {
            notes[step] = null
        } else {
            notes[step] = note
            e.target.classList.add('on')
        }

        console.debug(e.target)
    })



}, false)

/*
120bpmの場合
♩ = 60sec/120
♪. 60/bpm/4

 */