(function () {
  'use strict'
  const addAnim = key => key.classList.add('playing')
  const removeAnim = key => key.classList.remove('playing')
  const cache = {
    refs: {},
    pick(id) {
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
        key: keyRef,
      }
      return ref
    },
  }
  const playKitAudio = keyCode => {
    const id = `data-key="${keyCode}"`
    const { audio, key } = cache.pick(id)
    audio.currentTime = 0
    audio.play()
    addAnim(key)
  }
  const boot = () => {
    window.addEventListener('keydown', event => playKitAudio(event.keyCode), false)
    document.querySelectorAll('.key').forEach(key => {
      const keyCode = key.dataset.key
      key.addEventListener('click', () => playKitAudio(keyCode), false)
    })
  }
  document.addEventListener('DOMContentLoaded', boot, false)
}())
