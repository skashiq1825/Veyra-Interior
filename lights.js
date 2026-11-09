(function (V) {
  'use strict';

  V.createLighting = function createLighting({
      scene,
      root,
      info,
      renderer,
      quality
  }) {

      if (!scene) {
          throw new Error('Lighting requires a THREE.Scene');
      }

      // ==========================================
      // 1. AMBIENT LIGHT
      // ==========================================

      const ambientLight = new THREE.AmbientLight(
          0xffffff,
          0.8
      );

      scene.add(ambientLight);


      // ==========================================
      // 2. MAIN DIRECTIONAL LIGHT
      // ==========================================

      const directionalLight = new THREE.DirectionalLight(
          0xeac576,
          7
      );

      directionalLight.position.set(
          1.8,
          3.5,
          7.5
      );

      directionalLight.target.position.set(
               2.8,
          0.05,
        3.5
      );

      directionalLight.castShadow = true;

      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;

      directionalLight.shadow.bias = -0.0001;

      directionalLight.shadow.camera.left = -6;
      directionalLight.shadow.camera.right = 6;
      directionalLight.shadow.camera.top = 6;
      directionalLight.shadow.camera.bottom = -6;

      directionalLight.shadow.camera.near = 0.1;
      directionalLight.shadow.camera.far = 30;

      scene.add(directionalLight);
      scene.add(directionalLight.target);


      // ==========================================
      // 3. POINT LIGHT
      // ==========================================

      const pointLight = new THREE.PointLight(
          0xFFF7EB,
          5,
          5
      );

      pointLight.position.set(
          3,
          1.2,
          2.38
      );

      scene.add(pointLight);


      // ==========================================
      // 4. SPOT LIGHT
      // ==========================================

      const spotLight = new THREE.SpotLight(
          0xFFCB56,
          50,
          2,
          Math.PI * 0.1,
          1.4,
          0.01
      );

      spotLight.position.set(
        5.75, 2.65, 2.815
      );

      spotLight.target.position.set(
        5.75, 0, 2.815
      );

      spotLight.castShadow = true;

      scene.add(spotLight);
      scene.add(spotLight.target);


      // ==========================================
      // 5. SECOND DIRECTIONAL LIGHT
      // ==========================================

      const directionalLightFace = new THREE.DirectionalLight(
          0xFFCB3D,
          3
      );

      directionalLightFace.position.set(
        2.5,
          3.5,
          8.5
      );

      directionalLightFace.target.position.set(
     
            2.5,
          0.2,
          7.5
      );

      directionalLightFace.castShadow = true;

      directionalLightFace.shadow.mapSize.width = 1048;
      directionalLightFace.shadow.mapSize.height = 1048;

      directionalLightFace.shadow.bias = -0.0001;

      directionalLightFace.shadow.camera.left = -20;
      directionalLightFace.shadow.camera.right = 20;
      directionalLightFace.shadow.camera.top = 20;
      directionalLightFace.shadow.camera.bottom = -20;

      directionalLightFace.shadow.camera.near = 0.1;
      directionalLightFace.shadow.camera.far = 100;

      scene.add(directionalLightFace);
      scene.add(directionalLightFace.target);


      // ==========================================
      // 6. LIGHT HELPERS
      // ==========================================

      const directionalHelper =
          new THREE.DirectionalLightHelper(
              directionalLight,
              1,
              0xffff00
          );

      const directionalFaceHelper =
          new THREE.DirectionalLightHelper(
              directionalLightFace,
              1,
              0xff8800
          );

      const spotHelper =
          new THREE.SpotLightHelper(
              spotLight,
              0x00ff00
          );

      const pointHelper =
          new THREE.PointLightHelper(
              pointLight,
              0.2,
              0xff0000
          );


      // Add helpers to scene

      scene.add(directionalHelper);
      scene.add(directionalFaceHelper);
      scene.add(spotHelper);
      scene.add(pointHelper);


      // ==========================================
      // 7. HELPER VISIBILITY
      // ==========================================

      let helpersVisible = true;

      function setHelpersVisible(visible) {

          helpersVisible = visible;

          directionalHelper.visible = visible;
          directionalFaceHelper.visible = visible;
          spotHelper.visible = visible;
          pointHelper.visible = visible;
      }


      // ==========================================
      // 8. UPDATE HELPERS
      // ==========================================

      function updateHelpers() {

          directionalHelper.update();

          directionalFaceHelper.update();

          spotHelper.update();

          pointHelper.update();
      }


      // ==========================================
      // 9. LIGHT CONTROL
      // ==========================================

      const state = {

          artificial: true,

          daylight: true,

          sofaLight: true,

          helpers: true

      };


      function setArtificial(enabled) {

          state.artificial = enabled;

          spotLight.visible = enabled;
      }


      function setDaylight(enabled) {

          state.daylight = enabled;

          directionalLight.visible = enabled;

          directionalLightFace.visible = enabled;
      }


      function setSofaLight(enabled) {

          state.sofaLight = enabled;

          pointLight.visible = enabled;
      }


      // ==========================================
      // 10. SUMMARY
      // ==========================================

      function summary() {

          return {

              ambient: {
                  intensity: ambientLight.intensity
              },

              directional: {
                  intensity: directionalLight.intensity,
                  position: directionalLight.position.toArray()
              },

              spot: {
                  intensity: spotLight.intensity,
                  position: spotLight.position.toArray()
              },

              point: {
                  intensity: pointLight.intensity,
                  position: pointLight.position.toArray()
              },

              directionalFace: {
                  intensity: directionalLightFace.intensity,
                  position: directionalLightFace.position.toArray()
              },

              helpersVisible: helpersVisible

          };
      }


      // ==========================================
      // 11. APPLY
      // ==========================================

      function apply() {

          setArtificial(state.artificial);

          setDaylight(state.daylight);

          setSofaLight(state.sofaLight);

          setHelpersVisible(state.helpers);

          updateHelpers();
      }


      // ==========================================
      // 12. DISPOSE
      // ==========================================

      function dispose() {

          scene.remove(ambientLight);

          scene.remove(directionalLight);
          scene.remove(directionalLight.target);

          scene.remove(pointLight);

          scene.remove(spotLight);
          scene.remove(spotLight.target);

          scene.remove(directionalLightFace);
          scene.remove(directionalLightFace.target);

          scene.remove(directionalHelper);
          scene.remove(directionalFaceHelper);
          scene.remove(spotHelper);
          scene.remove(pointHelper);
      }


      // ==========================================
      // 13. RETURN
      // ==========================================

      return {

          // Lights
          ambientLight,
          directionalLight,
          directionalLightFace,
          spotLight,
          pointLight,

          // Helpers
          directionalHelper,
          directionalFaceHelper,
          spotHelper,
          pointHelper,

          // State
          state,

          // Functions
          apply,
          summary,
          dispose,

          updateHelpers,
          setHelpersVisible,

          setArtificial,
          setDaylight,
          setSofaLight,

          isArtificialOn: () => state.artificial,

          isDaylightOn: () => state.daylight,

          isSofaLightOn: () => state.sofaLight

      };

  };

})(window.VEYRA = window.VEYRA || {});