var context
var source
var vf
var filter
var masterVolume

var octave = 4
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

function init() {
    try {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
        prep()

        let now = context.currentTime

        // let bpm = 125
        // let tick = 15.0 / bpm
        //
        // noteOnAt(freqTable['e'], 2, now)
        // noteOffAt(now + tick * 8)
        // noteOnAt(freqTable['e'], 2, now + tick * 8)
        // noteOffAt(now + tick * 11)
        // noteOnAt(freqTable['d'], 2, now + tick * 12)
        // noteOffAt(now + tick * 15)
        //
        // noteOnAt(freqTable['e'], 2, now + tick * 16)
        // noteOffAt(now + tick * 24)
        // noteOnAt(freqTable['e'], 2, now + tick * 24)
        // noteOffAt(now + tick * 27)
        // noteOnAt(freqTable['g'], 2, now + tick * 28)
        // noteOffAt(now + tick * 31)

    }
    catch (e) {
        alert(e)
    }
}

var waveform = 'sawtooth';

function setWaveform() {
    let tmp = masterVolume.gain.value
    masterVolume.gain.setValueAtTime(0, context.currentTime + .1)
    source.type = waveform
    masterVolume.gain.setValueAtTime(tmp, context.currentTime + .1)
}

var subOsc
var subOscGain

function prep() {
    source = context.createOscillator()
    source.frequency.setValueAtTime(440, context.currentTime)

    subOsc = context.createOscillator()
    subOsc.type = 'square'
    subOscGain = context.createGain()

    let som = context.createChannelMerger(2)

    vf = context.createGain()
    vf.gain.setValueAtTime(0, context.currentTime)

    filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(330, context.currentTime)
    // filter.frequency.setValueAtTime(0, context.currentTime)
    setPeak()

    masterVolume = context.createGain()
    masterVolume.gain.setValueAtTime(0.6,context.currentTime)

    source.connect(som)
    subOsc.connect(subOscGain)
    subOscGain.connect(som)

    som.connect(vf)
    vf.connect(filter)
    filter.connect(masterVolume)
    masterVolume.connect(context.destination)

    setWaveform()

    source.start()
    subOsc.start()
}

var currentFreq = 0.0
var cutoff = 1.5;
var peak = 18

function setFilter(at) {
    filter.frequency.setValueAtTime(currentFreq * cutoff, at)
}

function setPeak(at = context.currentTime) {
    filter.Q.setValueAtTime(peak, at)
}

var detune = 4
var subOscWeight = 0

function setDetune(at) {
    let sf = Math.pow(2, detune / 12.0) * currentFreq
    console.log("Sub osc " + sf)
    subOsc.frequency.setValueAtTime(sf, at)
    subOscGain.gain.setValueAtTime(subOscWeight, at)
}

function noteOnAt(freq, oct, at = context.currentTime) {
    vf.gain.cancelAndHoldAtTime(at)
    vf.gain.setValueAtTime(.0, at)

    currentFreq = freq * Math.pow(2, oct - 4)
    console.log("Note on " + currentFreq)

    source.frequency.setValueAtTime(currentFreq, at)
    setDetune(at)
    setFilter(at)

    vf.gain.linearRampToValueAtTime(1.0, at + .01) // Attack
    vf.gain.linearRampToValueAtTime(.8, at + .5) // decay
    vf.gain.linearRampToValueAtTime(0.0, at + 3) // sustain
}

function noteOn(freq, oct) {
    noteOnAt(freq, oct, context.currentTime)

}

function shortcutKeyProc(e) {
    if (e.repeat) {
        return
    }

    // sub osc
    let now = context.currentTime
    switch (e.key) {
        case '1':
            if (subOscWeight < 1.0) {
                subOscWeight += .1
                setDetune(now)
                document.getElementById('synth-subosc').value = subOscWeight
            }
            return
        case 'q':
            if (subOscWeight > 0.1) {
                subOscWeight -= .1
                setDetune(now)
                document.getElementById('synth-subosc').value = subOscWeight
            }
            return
    }
    // detune
    switch (e.key) {
        case '2':
            if (detune < 12) {
                detune += 1
                setDetune(now)
                // document.getElementById('synth-detune').value = detune
            }
            return
        case 'w':
            if (detune > -12) {
                detune -= 1
                setDetune(now)
                // document.getElementById('synth-detune').value = detune
            }
            return
    }

    // cutoff
    switch (e.key) {
        case 'e':
            if (cutoff > 0.1) {
                cutoff -= 0.1
                console.log(cutoff)
                setFilter(now)
                document.getElementById('synth-cutoff').value = cutoff
            }
            return
        case '3':
            if (cutoff < 4.0) {
                cutoff += 0.1
                console.log(cutoff)
                setFilter(now)
                document.getElementById('synth-cutoff').value = cutoff
            }
            return
    }

    // peak
    switch (e.key) {
        case 'r':
            if (peak > 3) {
                peak -= 3
                console.log(peak)
                setPeak()
                document.getElementById('synth-peak').value = peak
            }
            return
        case '4':
            if (peak < 36) {
                peak += 3
                console.log(peak)
                setPeak()
                document.getElementById('synth-peak').value = peak
            }
            return
    }

    // piano keys
    var o = octave
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
            console.log("Other key:" + e.key)
            return
    }
    f = freqTable[n]
    noteOn(f, o)
    document.getElementById(n + o).classList.add('noteon')
}

function keyup(e) {
    noteOff()
}

function noteOffAt(at) {
    // console.log("Note off")
    vf.gain.linearRampToValueAtTime(0.0, at + .6) // release
    var ks = document.getElementsByClassName('noteon')
    for (let i of ks) {
        i.classList.remove(["noteon"])
    }
}
function noteOff() {
    noteOffAt(context.currentTime)
}

window.addEventListener("keydown", shortcutKeyProc, false)
window.addEventListener("keyup", keyup, false)

function clickKeyProc(e) {
    if (e.target.classList.contains("key")) {
        let os = e.target.id.substr(-1)
        let ns = e.target.id.replace(os, "")

        noteOn(freqTable[ns], 0 + os)
        e.target.classList.add("noteon")
    }
}

function waveSelectChanged(e) {
    console.log(e)

    let w = e.target.getAttribute('value')
    waveform = w
    setWaveform()
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
            console.log(e)
            tgt = e.target
            max = Number(tgt.max)
            min = Number(tgt.min)
            v = min + (max - min) * e.offsetX / e.target.clientWidth
            break

        default:
            return
    }
    // console.log(tgt)
    // console.log(v)
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
        context.resume().then(function () {
            console.log('Context resumed')
            prepBtn.removeEventListener('click', prepProp)
            prepBtn.style.display = 'none'
        }).catch(function () {
            console.log('Fail to resume context')
        })
    }
    prepBtn.addEventListener('click', prepProp)

    document.querySelectorAll('.psudo-drop').forEach(
        function (value, key, parent) {
            value.addEventListener("change", waveSelectChanged)
        }
    )
    let kbElem = document.querySelector("article.keyboard")
    kbElem.addEventListener("mousedown", clickKeyProc, false)
    kbElem.addEventListener("mouseup", noteOff, false)

    addMeterEventListener('synth-detune',function (v) {
        console.log(v)
        detune = v
        setDetune(context.currentTime)
    })
    addMeterEventListener('synth-subosc', function (v) {
        subOscWeight = v
        setDetune(context.currentTime)
    })
    addMeterEventListener('synth-cutoff', function (v) {
        cutoff = v
        setFilter(context.currentTime)
    })
    addMeterEventListener('synth-peak', function (v) {
        peak = v
        setPeak(context.currentTime)
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
            start_time = context.currentTime
            playHandle = setInterval(function () {
                let cgs = '#matrix colgroup.mesure col.note'+ note_index
                let cg = document.querySelector(cgs)
                if (cg) {
                    cg.classList.remove('current')
                }
                let now = context.currentTime
                let v0 = (now - start_time) / note_tick
                note_index = (Math.trunc(v0) % 16) + 1
                document.querySelector('#matrix colgroup.mesure col.note'+ note_index).classList.add('current')
            }, interval)
        } else {
            if (playHandle) {
                clearInterval(playHandle)
                document.querySelectorAll('#matrix colgroup.mesure col').forEach(function (v, ix) {
                    v.classList.remove('current')
                })
                note_index = 0
            }
        }
    })

    let notes = []
    document.querySelector('#matrix tbody').addEventListener('click', function (e) {
        let step = e.target.cellIndex - 1
        let note = e.target.closest('tr').rowIndex
        if (notes[step]) {
            let qs = '#matrix tbody tr td:nth-child(' + (step + 2) + ')'
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

        // row.forEach(function (v, ix) {
        //     console.log(v)
        // })

        console.log(e.target)
    })



}, false)

/*
120bpmの場合
♩ = 60sec/120
♪. 60/bpm/4

 */