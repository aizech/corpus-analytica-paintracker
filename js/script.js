document.addEventListener("DOMContentLoaded", function () {
    var canvas=document.getElementById("renderCanvas");
    var canvasSize=Math.min(window.innerWidth, window.innerHeight) * 1;
    var markerMeshes=[]; // Store added marker meshes

    canvas.width=canvasSize;
    canvas.height=canvasSize;

    var engine=new BABYLON.Engine(canvas, true);
    var scene=new BABYLON.Scene(engine);
    scene.clearColor=new BABYLON.Color4(0, 0, 0, 0);

    var camera=new BABYLON.ArcRotateCamera("camera",
      Math.PI / 2,
      Math.PI / 3,
      canvasSize * 5,
      BABYLON.Vector3.Zero(),
      scene);
    // Enable intuitive zooming with mouse wheel and clamp zoom distance
    camera.lowerRadiusLimit = canvasSize * 0.5;
    camera.upperRadiusLimit = canvasSize * 6;
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl(canvas, true);

    var sceneCenter=new BABYLON.Vector3(0, 800, 0);
    camera.setTarget(sceneCenter);

    var lightDirection=new BABYLON.Vector3(0, -1, 0);
    var light=new BABYLON.DirectionalLight("dirLight", lightDirection, scene);
    light.position=new BABYLON.Vector3(0, 15, -30);
    light.intensity=2;
    light.castShadow=true;

    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.usePoissonSampling = true;

    var currentModel=null;

    function loadAndConfigureModel(modelPath, scene) {
      // Split full URL into rootUrl and filename so Babylon can load remote models correctly
      var lastSlashIndex = modelPath.lastIndexOf("/");
      var rootUrl = modelPath.substring(0, lastSlashIndex + 1);
      var fileName = modelPath.substring(lastSlashIndex + 1);

      BABYLON.SceneLoader.ImportMesh("", rootUrl, fileName, scene, function (newMeshes) {
        if (currentModel) {
            currentModel.dispose();
        }

        var model = newMeshes[0];

        model.position=BABYLON.Vector3.Zero();
        model.rotation=BABYLON.Vector3.Zero();
        model.scaling=new BABYLON.Vector3(1, 1, 1);
        model.position.y=-model.getBoundingInfo().boundingBox.extendSize.y;

        currentModel=model;

        shadowGenerator.addShadowCaster(model);
      });
    }

    function resizeCanvas() {
      canvasSize=Math.min(window.innerWidth, window.innerHeight) * 0.8;
      canvas.width=canvasSize;
      canvas.height=canvasSize;
      camera.radius=canvasSize * 1.5;
      engine.resize();
    }

    var selectedModel="male";
    
    // Build model URLs from the plugin base URL provided by PHP
    var baseUrl = (window.PaintrackerConfig && PaintrackerConfig.baseUrl) ? PaintrackerConfig.baseUrl : "";
    var modelUrlMale = baseUrl + "models/male_model-1.glb";
    var modelUrlFemale = baseUrl + "models/female_model-1.glb";

    function init() {
      loadAndConfigureModel(modelUrlMale, scene);

      engine.runRenderLoop(function () {
        scene.render();
      });

      // Start the render loop
      engine.runRenderLoop(function () {
        scene.render();
      });

      var hemiLight=new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      hemiLight.intensity=1;

      window.addEventListener("resize", resizeCanvas);

      var modelToggle=document.getElementById("modelToggle");

      modelToggle.addEventListener("change", function () {
        if (modelToggle.checked) {
          selectedModel="female"; // Setze die Auswahl auf "female"
          loadAndConfigureModel(modelUrlFemale, scene);
        } else {
          selectedModel="male"; // Setze die Auswahl auf "male"
          loadAndConfigureModel(modelUrlMale, scene);
        }

        scene.render();
      });

      var pointerEnabled=false;
      var pointerMesh=null;
      var markerPositions=[];
      var markerListContainer = document.getElementById('paintracker-features-container');

      // Ensure we have a container for the marker list; create one if missing
      if (!markerListContainer) {
        var modalContent = document.querySelector('#myModal .modal-content');
        if (modalContent) {
          markerListContainer = document.createElement('div');
          markerListContainer.id = 'paintracker-features-container';
          markerListContainer.className = 'features-container';
          modalContent.appendChild(markerListContainer);
        }
      }

      function renderMarkerList() {
        if (!markerListContainer) {
          return;
        }

        if (!markerPositions.length) {
          markerListContainer.innerHTML = '<p>Keine Markierungen vorhanden.</p>';
          return;
        }

        var html = '<ul class="pt-marker-list">';
        markerPositions.forEach(function (entry, index) {
          var label = 'Marker ' + (index + 1);
          if (entry.description) {
            label += ': ' + entry.description;
          }
          html += '<li data-index="' + index + '">' +
                    '<span>' + label + '</span> ' +
                    '<button type="button" class="pt-marker-delete" data-index="' + index + '">Löschen</button>' +
                  '</li>';
        });
        html += '</ul>';

        markerListContainer.innerHTML = html;

        var buttons = markerListContainer.querySelectorAll('.pt-marker-delete');
        buttons.forEach(function (btn) {
          btn.addEventListener('click', function (evt) {
            evt.preventDefault();
            var idx = parseInt(btn.getAttribute('data-index'), 10);
            deleteMarkerByIndex(idx);
          });
        });
      }

      // Initialize marker list UI (empty state) now that markerListContainer is set/created
      renderMarkerList();

      function deleteMarkerByIndex(index) {
        if (isNaN(index) || index < 0 || index >= markerPositions.length) {
          return;
        }

        var markerData = markerPositions[index];

        // Remove from positions array
        markerPositions.splice(index, 1);

        // Find and dispose corresponding mesh
        for (var i = markerMeshes.length - 1; i >= 0; i--) {
          var m = markerMeshes[i];
          if (m && m._caDataRef === markerData) {
            m.dispose();
            markerMeshes.splice(i, 1);
            break;
          }
        }

        renderMarkerList();
      }

      function enablePointer() {
        pointerEnabled=true;
        camera.detachControl(canvas);
      }

      function disablePointer() {
          pointerEnabled = false;
          canvas.style.cursor = 'grab'; // Stil auf 'grab' setzen
          camera.attachControl(canvas, true);
      }

      resetButton.addEventListener("click", function (event) {
        event.preventDefault(); // Verhindere das Standardverhalten des Buttons

        console.log("Reset button clicked");
        console.log("Number of marker meshes before disposal:", markerMeshes.length);

        // Dispose of marker meshes and clear the array
        for (var i = 0; i < markerMeshes.length; i++) {
          if (markerMeshes[i]) {
            markerMeshes[i].dispose(); // Dispose of the marker mesh if it exists
          }
        }

        markerMeshes = []; // Clear the array

        markerPositions = []; // Reset marker positions

        console.log("Number of marker meshes after disposal:", markerMeshes.length);

        // Reset the marker mask texture
        markerMaskTexture.getContext().clearRect(0, 0, markerMaskTexture.getSize().width, markerMaskTexture.getSize().height);
        markerMaskTexture.update();

        // Re-enable pointer controls
        disablePointer();
        pointerButton.classList.remove("active");

        // Refresh marker list UI
        renderMarkerList();
      });

      saveButton.addEventListener("click", function (event) {
        event.preventDefault();

        var jsonData = {
          modelURL: selectedModel === "female" ? "female" : "male",
          markerPositions: markerPositions,
        };

        var jsonString = JSON.stringify(jsonData, null, 4); // Formatiere die JSON-Zeichenfolge mit Einrückungen von 4 Leerzeichen

        // Speichere JSON-Daten im versteckten Feld
        document.getElementById("json_data").value = jsonString;

        // Schließe das Modal nach dem Speichern
        closeModal();
      });

      var selectedMarkerSize=1; // Default marker size

      // Function to create a marker with the given size
      var markerMaterials= {}

      ; // Store different marker materials for various sizes

      // Function to create a marker with the given size
      function createMarker(size, pickedPoint, description) {
        var marker = BABYLON.MeshBuilder.CreateSphere("marker", {
          diameter: 20 * selectedMarkerSize, segments: 32
        }, scene);

        var markerMaterial = new BABYLON.StandardMaterial("markerMaterial", scene);
        markerMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        markerMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        markerMaterial.alpha = 0.5;
        markerMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        marker.material = markerMaterial;
        marker.position = pickedPoint.clone();

        // Add a user-defined description to the marker
        marker.description = description;

        // Store position, size, and description and keep a reference on the marker
        var markerData = {
          position: marker.position.clone(),
          size: selectedMarkerSize,
          description: description
        };
        markerPositions.push(markerData);
        marker._caDataRef = markerData;

        // Attach a click event to the marker to display the description
        marker.actionManager = new BABYLON.ActionManager(scene);
        marker.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, function () {
            showMarkerDescription(marker.description);
          }
        ));

        markerMeshes.push(marker);
        disablePointer();
        pointerButton.classList.remove("active");

        // Update the marker list UI
        renderMarkerList();
      }

      // Function to show the marker description in a popup
      function showMarkerDescription(description) {
        var popup = document.getElementById("popup");
        var popupDescription = document.getElementById("popup-description");

        popupDescription.textContent = "Beschwerden:\n" + description;

        // Display the popup
        popup.style.display = "block";
      }

      // Handler for the popup close button
      var popupCloseButton = document.getElementById("popup-close");
      popupCloseButton.addEventListener("click", function () {
        var popup = document.getElementById("popup");
        popup.style.display = "none";
      });

      var markerMaskTexture=new BABYLON.DynamicTexture("markerMaskTexture", 512, scene);
      markerMaskTexture.hasAlpha=true;

      // Function to paint the marker region on the mask texture
      function paintMarkerRegion(pickedPoint) {
        var textureContext=markerMaskTexture.getContext();

        var radius=selectedMarkerSize * 20; // Adjust based on your preference
        var centerX=(pickedPoint.x + 0.5) * markerMaskTexture.getSize().width;
        var centerY=(1 - (pickedPoint.z + 0.5)) * markerMaskTexture.getSize().height;

        textureContext.beginPath();
        textureContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        textureContext.fillStyle="rgba(255, 0, 0, 0.8)"; // Red color with alpha
        textureContext.fill();
        textureContext.closePath();

        markerMaskTexture.update(); 
      }

      function handlePointerClick(event) {
        if (pointerEnabled) {
          var canvasRect = canvas.getBoundingClientRect();
          // Map mouse position (CSS pixels) into canvas pixel coordinates.
          // This accounts for differences between canvas width/height and its on-screen size.
          var cssX = event.clientX - canvasRect.left;
          var cssY = event.clientY - canvasRect.top;

          var offsetX = cssX * (canvas.width / canvasRect.width);
          var offsetY = cssY * (canvas.height / canvasRect.height);

          // Create a picking ray from the camera through the click point
          var ray = scene.createPickingRay(offsetX, offsetY, BABYLON.Matrix.Identity(), camera);

          var pickResult = scene.pickWithRay(ray); // Use raycasting for accurate hit testing

          if (pickResult.hit) {
            // Prompt the user to enter a description for the marker
            var markerDescription = prompt("Bitte beschreiben sie kurz ihre Beschwerde an dieser Stelle:");

            if (markerDescription) {
              paintMarkerRegion(pickResult.pickedPoint);
              createMarker(selectedMarkerSize, pickResult.pickedPoint, markerDescription);
            }
          }
        }
      }

      var pointerButton=document.getElementById("pointerButton");
      var markerSizeSlider=document.getElementById("markerSizeSlider");
      var canvasCursor=document.getElementById("renderCanvas");

      markerSizeSlider.addEventListener("input", function () {
        // Slider still controls marker size in 3D
        selectedMarkerSize=parseFloat(markerSizeSlider.value);

        // Cursor should stay same visible red circle size regardless of slider
        if (pointerEnabled) {
          var visualSize = 20; // constant radius in pixels for cursor graphic
          var cursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${visualSize * 2}" height="${visualSize * 2}" viewBox="0 0 ${visualSize * 2} ${visualSize * 2}"><circle cx="${visualSize}" cy="${visualSize}" r="${visualSize - 3}" stroke="rgba(255, 0, 0, 0.8)" stroke-width="6" fill="transparent"/></svg>`;
          canvasCursor.style.cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(cursorSvg)}') ${visualSize} ${visualSize}, auto`;
        }
      });

      pointerButton.addEventListener("click", function (event) {
        event.preventDefault(); // Verhindere das Standardverhalten des Buttons

        if (pointerEnabled) {
            disablePointer();
            pointerButton.classList.remove("active");
        } else {
            enablePointer();
            pointerButton.classList.add("active");
        }
      });

      canvas.addEventListener("mousemove", function (event) {
        if (pointerEnabled) {
          var visualSize = 20; // constant cursor size
          canvasCursor.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${visualSize * 2}" height="${visualSize * 2}" viewBox="0 0 ${visualSize * 2} ${visualSize * 2}"><circle cx="${visualSize}" cy="${visualSize}" r="${visualSize - 3}" stroke="rgba(255, 0, 0, 0.8)" stroke-width="6" fill="transparent"/></svg>') ${visualSize} ${visualSize}, auto`;
        } else {
          canvasCursor.style.cursor='grab';
        }
      });

      canvas.addEventListener("click", handlePointerClick);

      scene.dispose=function () {
        for (var i=0; i < markerPositions.length; i++) {
          markerPositions[i].dispose();
        }

        if (pointerMesh) {
          pointerMesh.dispose();
        }
      }
    ;
  }

  init();
});