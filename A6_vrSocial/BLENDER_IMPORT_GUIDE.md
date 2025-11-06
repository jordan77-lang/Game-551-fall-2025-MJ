# How to Import Your Blender Room

## Step 1: Export from Blender

1. Open your room model in Blender
2. Select all objects you want to export (A to select all, or select specific objects)
3. **File → Export → glTF 2.0 (.glb/.gltf)**

### Important Export Settings:

**Format Tab:**
- Format: **glTF Binary (.glb)** ← Single file, easiest!
- Include: **Selected Objects** (or Visible Objects)

**Transform Tab:**
- +Y Up: **✓ Checked**

**Geometry Tab:**
- Apply Modifiers: **✓**
- UVs: **✓**
- Normals: **✓**
- Tangents: ✓ (if using normal maps)
- Vertex Colors: ✓ (if using)

**Materials Tab:**
- Materials: **Export**
- Images: **Automatic**

**Compression (Optional):**
- Compression: **Draco** (makes file smaller, slower to load)

4. Save as: `room.glb`

## Step 2: Add to Project

Copy `room.glb` to:
```
A6_vrSocial/public/models/room.glb
```

## Step 3: View in VR

Go to: `http://localhost:8080/room.html`

The model will automatically load!

## Tips for Best Results:

### Scale
- 1 Blender Unit = 1 Meter in VR
- Make sure your room is life-sized (2-3m ceiling height)
- Average person height: 1.7m

### Lighting
- Bake lighting in Blender for best performance
- Or use emission materials for lights
- The VR scene adds some default lights

### Materials
- Use Principled BSDF shader (standard)
- Base Color, Metallic, Roughness work best
- Normal maps and textures are supported

### Performance
- Keep polygon count reasonable (< 100k triangles)
- Optimize textures (1024x1024 or 2048x2048 max)
- Use Draco compression for web

### Common Issues

**Model appears too big/small:**
- Check scale in Blender
- Apply scale: Ctrl+A → Scale

**Model is black:**
- Add lights in Blender
- Or bake lighting
- Check if materials exist

**Textures missing:**
- Make sure textures are packed or relative paths
- Or use "File → External Data → Pack Resources"

**Model not appearing:**
- Check browser console (F12) for errors
- Make sure file is named `room.glb`
- Make sure it's in `public/models/` folder

## Alternative: Use Any GLB File

You can also:
1. Download free models from:
   - Sketchfab (download as glTF)
   - Poly Pizza
   - Google Poly Archive
2. Rename to `room.glb`
3. Place in `public/models/`

## Next Steps

Once your room loads:
- Test in VR mode (Quest)
- Add multiplayer avatars
- Add interactive objects
- Integrate with authentication system
