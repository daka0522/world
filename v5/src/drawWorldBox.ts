import * as THREE from 'three'

function drawLine(scene: THREE.Scene, points: THREE.Vector3[] | THREE.Vector2[], material: any) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}


export function drawWorldBox(scene: THREE.Scene, boxSize: number, color: THREE.ColorRepresentation) {

    const material = new THREE.MeshPhongMaterial({ color: color });

    {
        // Top
        const p1 = new THREE.Vector3(boxSize, boxSize, boxSize)
        const p2 = new THREE.Vector3(boxSize, boxSize, -boxSize)
        const p3 = new THREE.Vector3(-boxSize, boxSize, -boxSize)
        const p4 = new THREE.Vector3(-boxSize, boxSize, boxSize)

        const points = [p1, p2, p3, p4, p1]

        drawLine(scene, points, material)
    }
    {
        // Bottom

        const p1 = new THREE.Vector3(boxSize, -boxSize, boxSize)
        const p2 = new THREE.Vector3(boxSize, -boxSize, -boxSize)
        const p3 = new THREE.Vector3(-boxSize, -boxSize, -boxSize)
        const p4 = new THREE.Vector3(-boxSize, -boxSize, boxSize)

        const points = [p1, p2, p3, p4, p1];

        drawLine(scene, points, material)
    }
    {
        // Columns

        const p1 = new THREE.Vector3(boxSize, boxSize, boxSize)
        const p2 = new THREE.Vector3(boxSize, -boxSize, boxSize)

        drawLine(scene, [p1, p2], material)

        const p3 = new THREE.Vector3(-boxSize, boxSize, boxSize)
        const p4 = new THREE.Vector3(-boxSize, -boxSize, boxSize)

        drawLine(scene, [p3, p4], material)

        const p5 = new THREE.Vector3(boxSize, boxSize, -boxSize)
        const p6 = new THREE.Vector3(boxSize, -boxSize, -boxSize)

        drawLine(scene, [p5, p6], material)

        const p7 = new THREE.Vector3(-boxSize, boxSize, -boxSize)
        const p8 = new THREE.Vector3(-boxSize, -boxSize, -boxSize)

        drawLine(scene, [p7, p8], material)
    }
}