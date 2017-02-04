(function () {
  'use strict'
  const DRUM_KEY = {
    CLAP: 65,
    HI_HAT_CLOSED: 83,
    KICK: 68,
    HI_HAT_OPEN: 70,
    BOOM: 71,
    RIDE: 72,
    SNARE: 74,
    TOM: 75,
    TINK: 76
  }

  const BEAT_DURATION = {
    WHOLE: 1.0,
    HALF: 0.5,
    QUARTER: 0.25,
    EIGHTH: 0.125,
    SIXTEENTH: 0.0625
  }

  const addAnim = key => key.classList.add('playing')
  const removeAnim = key => key.classList.remove('playing')
  const cache = {
    refs: {},
    pick (id) {
      let ref = cache.refs[id]
      if (ref) {
        return ref
      }
      const audioRef = document.querySelector(`audio[${id}]`)
      if (!audioRef) {
        throw new Error(`Missing required Audio Element for ${id}`)
      }
      const keyRef = document.querySelector(`.key[${id}]`)
      if (!keyRef) {
        throw new Error(`Missing required Element with .key class for ${id}`)
      }
      keyRef.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'transform') {
          removeAnim(keyRef)
        }
      }, false)
      audioRef.addEventListener('ended', () => removeAnim(keyRef), false)
      ref = cache.refs[id] = {
        audio: audioRef,
        key: keyRef
      }
      return ref
    }
  }
  const playKitAudio = keyCode => {
    const id = `data-key="${keyCode}"`
    const { audio, key } = cache.pick(id)
    audio.currentTime = 0
    audio.play()
    addAnim(key)
  }

  const Track = (function () {
    class Track {
      constructor () {
        this._events = {}
        this._duration = 0
      }
      get duration () { return this._duration }
      define (pattern, bpm = 120) {
        pattern.forEach((step, index) => {
          const whole = 4 * (60 / bpm)
          const beatTime = index * (whole * step.time)
          const eventId = `beat-${beatTime}`
          const trackEvent = {
            index,
            beatTime,
            keyCode: step.keyCode,
            plays: 0
          }
          this._events[eventId] = trackEvent
          // console.log(`add track event ${eventId}
          //   beatTime=${beatTime}  keyCode=${trackEvent.keyCode}`)
          if (this._duration < beatTime) {
            this._duration = (whole * step.time) + beatTime
          }
        })
      }
      reset () {
        Object.keys(this._events).forEach(eventId => {
          const trackEvent = this._events[eventId]
          trackEvent.plays = 0
        })
      }
      play (time) {
        if (time > this._duration) {
          this.reset()
          return
        }
        const eventIds = Object.keys(this._events)
        const count = eventIds.length
        for (let i = 0; i < count; i += 1) {
          const eventId = eventIds[i]
          const trackEvent = this._events[eventId]

          if (time >= trackEvent.beatTime && trackEvent.plays === 0) {
            trackEvent.plays = 1
            // console.log(`play track event eventId=${eventId}
            //   time=${time} beatTime=${trackEvent.beatTime}
            //   keyCode=${trackEvent.keyCode}`)
            playKitAudio(trackEvent.keyCode)
            return
          }
        }
      }
    }
    return Track
  }())

  const Timeline = (function () {
    class Timeline {
      constructor () {
        this._time = 0
        this._tracks = {}
        this._paused = false
        this._duration = 0
        this.loop = false
      }
      pause () {
        this._paused = true
      }
      resume () {
        this._paused = false
      }
      get paused () { return this._paused }
      addTrack (name, track) {
        this._tracks[name] = track
        if (track.duration > this._duration) {
          this._duration = track.duration
        }
      }
      start () {
        const onPlay = () => {
          if (this._paused) {
            return
          }
          this._time += 0.033
          Object.keys(this._tracks).forEach(name => {
            const track = this._tracks[name]
            track.play(this._time)
          })
          if (this._time >= this._duration) {
            if (this.loop) {
              this._time = 0
            } else {
              this.stop()
            }
          }
        }
        this._playInterval = setInterval(onPlay, 33)
      }
      stop () {
        if (this._playInterval) {
          this._time = 0
          this._paused = false
          clearInterval(this._playInterval)
          this._playInterval = null
        }
      }
    }
    return Timeline
  }())

  const testDrummer = () => {
    const beat = (time, keyCode) => {
      return { time, keyCode }
    }

    const BPM = 120

    const boomTrack = new Track()
    boomTrack.define([
      beat(BEAT_DURATION.WHOLE, DRUM_KEY.BOOM),
      beat(BEAT_DURATION.WHOLE, DRUM_KEY.BOOM)
    ], BPM)

    const kickTrack = new Track()
    kickTrack.define([
      beat(BEAT_DURATION.QUARTER, DRUM_KEY.KICK),
      beat(BEAT_DURATION.QUARTER, DRUM_KEY.KICK),
      beat(BEAT_DURATION.QUARTER, DRUM_KEY.KICK),
      beat(BEAT_DURATION.QUARTER, DRUM_KEY.KICK)
    ], BPM)

    const hatTrack = new Track()
    hatTrack.define([
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_OPEN),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_CLOSED),
      beat(BEAT_DURATION.EIGHTH, DRUM_KEY.HI_HAT_OPEN)
    ], BPM)

    const timeline = new Timeline()
    timeline.addTrack('Boom', boomTrack)
    timeline.addTrack('Kick', kickTrack)
    timeline.addTrack('Hi Hat', hatTrack)

    window.tl = timeline
  }

  const boot = () => {
    window.addEventListener('keydown', event => playKitAudio(event.keyCode), false)
    document.querySelectorAll('.key').forEach(key => {
      const keyCode = key.dataset.key
      key.addEventListener('click', () => playKitAudio(keyCode), false)
    })

    testDrummer()
  }
  document.addEventListener('DOMContentLoaded', boot, false)
}())
