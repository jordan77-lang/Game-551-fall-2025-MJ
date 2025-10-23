// Minimal VRButton.js for Three.js r150+ (ES module)
// Source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/webxr/VRButton.js

export class VRButton {
  static createButton(renderer) {
    const button = document.createElement('button');
    function showEnterVR(/*device*/) {
      let currentSession = null;
      async function onSessionStarted(session) {
        session.addEventListener('end', onSessionEnded);
        await renderer.xr.setSession(session);
        button.textContent = 'EXIT VR';
        currentSession = session;
      }
      function onSessionEnded(/*event*/) {
        currentSession.removeEventListener('end', onSessionEnded);
        button.textContent = 'ENTER VR';
        currentSession = null;
      }
      button.style.display = '';
      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';
      button.textContent = 'ENTER VR';
      button.onmouseenter = () => button.style.opacity = '1.0';
      button.onmouseleave = () => button.style.opacity = '0.5';
      button.onclick = async () => {
        if (currentSession === null) {
          const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };
          try {
            const session = await navigator.xr.requestSession('immersive-vr', sessionInit);
            await onSessionStarted(session);
          } catch (e) {
            console.warn('VRButton: Unable to start session', e);
          }
        } else {
          currentSession.end();
        }
      };
    }
    if ('xr' in navigator) {
      button.id = 'VRButton';
      button.style.position = 'absolute';
      button.style.bottom = '20px';
      button.style.padding = '12px 6px';
      button.style.border = '1px solid #fff';
      button.style.borderRadius = '4px';
      button.style.background = 'rgba(0,0,0,0.1)';
      button.style.color = '#fff';
      button.style.font = 'normal 13px sans-serif';
      button.style.opacity = '0.5';
      button.style.outline = 'none';
      button.style.zIndex = '999';
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        supported ? showEnterVR() : showWebXRNotFound();
      });
    } else {
      showWebXRNotFound();
    }
    function showWebXRNotFound() {
      button.style.display = '';
      button.style.cursor = 'auto';
      button.style.left = 'calc(50% - 75px)';
      button.style.width = '150px';
      button.textContent = 'VR NOT SUPPORTED';
      button.onclick = null;
    }
    return button;
  }
}
