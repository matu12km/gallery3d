import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  useTexture,
  Environment,
  Loader,
  MeshReflectorMaterial,
  RoundedBox,
  Text,
  PointerLockControls,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

type ImageItem = {
  url: string;
  title?: string;
  author?: string;
};

interface Props {
  images?: ImageItem[];
  roomSize?: { w: number; h: number; d: number }; // 幅・高さ・奥行
}

export default function PhotoGallery3D({
  images = [
    {
      url: "/images/photo1.jpg",
      title: "静かな街角",
      author: "you",
    },
    {
      url: "/images/photo2.jpg",
      title: "影を歩く",
      author: "you",
    },
    {
      url: "/images/photo3.jpg",
      title: "色のない世界",
      author: "you",
    },
    {
      url: "/images/photo4.jpg",
      title: "遠ざかる",
      author: "you",
    },
    { url: "/images/photo5.jpg", title: "沈む心", author: "you" },
  ],
  roomSize = { w: 24, h: 4, d: 16 },
}: Props) {
  // mode 切替は廃止。マウスドラッグ（OrbitControls）と WASD 移動を常時有効にする。

  const orbitRef = useRef<any>(null);

  return (
    <div
      className="relative w-full h-[100vh]"
      style={{ width: "100%", height: "100vh" }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        shadows
        gl={{ antialias: true }}
        // カメラを部屋の内側に配置する（壁の外側に出てしまわないようにする）
        camera={{ position: [0, 1.7, roomSize.d / 2 - 2], fov: 60 }}
      >
        <color attach="background" args={[0.05, 0.05, 0.06]} />
        <Suspense
          fallback={
            <Html center style={{ width: "10rem", color: "#fff" }}>
              テクスチャ読込中…
            </Html>
          }
        >
          <Environment preset="city" background={false} />
          <GalleryLighting />
          <Room {...roomSize} />
          <Frames images={images} roomSize={roomSize} />
          <Skirting w={roomSize.w} d={roomSize.d} />
          <CeilingRail w={roomSize.w} d={roomSize.d} images={images} />
          {/* 接地の微細シャドウで額と床の接触を強調 */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.6}
            width={20}
            height={20}
            blur={2}
            far={1.6}
          />
          <Floor w={roomSize.w} d={roomSize.d} />
        </Suspense>

        {/* OrbitControls を削除して、マウスドラッグで直接カメラ回転を制御 */}
        <PointerLookWalk roomSize={roomSize} />
      </Canvas>
      {/* モード切替ボタンを削除。ドラッグで視点、WASDで移動が常時可能。 */}

      <Loader />
    </div>
  );
}

function GalleryLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      {/* 天井ライトのラインを少しだけ */}
      <rectAreaLight
        intensity={4}
        width={6}
        height={0.1}
        position={[0, 3.8, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <directionalLight
        castShadow
        position={[5, 6, 5]}
        intensity={0.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
}

function Room({ w, h, d }: { w: number; h: number; d: number }) {
  // 壁と天井（内向き）
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // 壁を白っぽく変更。完全な真っ白だと眩しいためわずかに暖かみを残したオフホワイト。
        color: new THREE.Color(0.96, 0.96, 0.95),
        // 壁らしいマット感を維持しつつ、ややだけ艶を抑える
        roughness: 0.88,
        metalness: 0.0,
      }),
    []
  );
  // 天井は壁よりわずかにトーンを落とした非常に淡いグレーにする
  const ceilingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // 少しだけ明るめにして目で変化がわかりやすいようにする
        color: new THREE.Color(0.93, 0.93, 0.94),
        roughness: 0.88,
        metalness: 0.0,
        // カメラが部屋内側にあるため裏面が見えることがある。
        // 念のため両面描画にして色が確実に反映されるようにする。
        side: THREE.DoubleSide,
      }),
    []
  );
  // 照明や環境で色味が変わってしまう問題が残る場合に備え、
  // 確実に表示させるための Basic マテリアルも用意しておく
  const ceilingBasicMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.93, 0.93, 0.94),
        side: THREE.DoubleSide,
      }),
    []
  );
  return (
    <group>
      {/* 左右・前後の壁 */}
      <mesh receiveShadow position={[0, h / 2, -d / 2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[w, h]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh
        receiveShadow
        position={[0, h / 2, d / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[w, h]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh
        receiveShadow
        position={[w / 2, h / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[d, h]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh
        receiveShadow
        position={[-w / 2, h / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[d, h]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* 天井 */}
      <mesh receiveShadow position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        {/* 照明の影響で色が変わる場合に備え、BasicMaterial を使用して
            常に意図した色が出るようにする（見た目の安定化） */}
        <primitive object={ceilingBasicMat} attach="material" />
      </mesh>
    </group>
  );
}

function Floor({ w, d }: { w: number; d: number }) {
  // 軽いパターンをキャンバスで作成して床に貼る
  const canvasTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    // ベース色
    ctx.fillStyle = "#141417";
    ctx.fillRect(0, 0, c.width, c.height);
    // サブのノイズライン（目立たない）
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = (i / 14) * c.height + (Math.random() - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(w / 2, d / 2);
    return tex;
  }, [w, d]);

  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <MeshReflectorMaterial
        map={canvasTex}
        map-anisotropy={4}
        mirror={0.18}
        blur={[400, 80]}
        resolution={1024}
        mixBlur={4}
        mixStrength={8}
        roughness={0.55}
        metalness={0.06}
        color="#17171a"
      />
    </mesh>
  );
}

// 壁の下部に取り付ける巾木（skirting board）
function Skirting({ w, d }: { w: number; d: number }) {
  const height = 0.08;
  const thickness = 0.08;
  return (
    <group>
      {/* 前 */}
      <mesh position={[0, height / 2, -d / 2 + thickness / 2]} receiveShadow>
        <boxGeometry args={[w, height, thickness]} />
        <meshStandardMaterial
          color="#101015"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* 後 */}
      <mesh position={[0, height / 2, d / 2 - thickness / 2]} receiveShadow>
        <boxGeometry args={[w, height, thickness]} />
        <meshStandardMaterial
          color="#101015"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* 右 */}
      <mesh position={[w / 2 - thickness / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[thickness, height, d]} />
        <meshStandardMaterial
          color="#101015"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* 左 */}
      <mesh position={[-w / 2 + thickness / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[thickness, height, d]} />
        <meshStandardMaterial
          color="#101015"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

// 天井のスポットレール（前壁寄せ、スポットライト配置）
function CeilingRail({
  w,
  d,
  images,
}: {
  w: number;
  d: number;
  images?: ImageItem[];
}) {
  // レールを前壁側に寄せる（前壁 = -d/2）
  const railY = 3.8;
  const railThickness = 0.06;
  const railZ = -d / 2 + 0.45; // 前壁寄せ
  const railLength = w * 0.6;

  const gap = 2.6; // Frames と合わせる
  const eye = 2.0;

  const imgs = images ?? [];
  const perWall = Math.max(1, Math.ceil(imgs.length / 4));
  const frontCount = perWall; // front wall items count
  const span = (frontCount - 1) * gap;

  const spotRefs = useRef<Array<THREE.SpotLight | null>>([]);
  const targetRefs = useRef<Array<THREE.Object3D | null>>([]);

  useEffect(() => {
    for (let i = 0; i < frontCount; i++) {
      const spot = spotRefs.current[i];
      const tgt = targetRefs.current[i];
      if (spot && tgt) spot.target = tgt;
    }
  }, [frontCount]);

  return (
    <group position={[0, railY, railZ]}>
      {/* レール本体 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[railLength, railThickness, 0.12]} />
        <meshStandardMaterial
          color="#0c0c0f"
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {Array.from({ length: frontCount }).map((_, i) => {
        const offset = i * gap - span / 2; // same offset used in Frames
        // target z in world coords is near front wall
        const targetWorldZ = -d / 2 + 0.01;
        const targetRelZ = targetWorldZ - railZ; // group-relative z

        return (
          <group key={i}>
            {/* ハウジング（見た目） */}
            <mesh position={[offset, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.18, 8]} />
              <meshStandardMaterial
                emissive={new THREE.Color(0x222222)}
                emissiveIntensity={0.6}
                color="#0b0b0b"
              />
            </mesh>

            {/* スポットライト（レールから少し下げて配置） */}
            <spotLight
              ref={(el) => (spotRefs.current[i] = el)}
              position={[offset, -0.05, 0]}
              intensity={3.0}
              angle={0.45}
              penumbra={0.6}
              distance={6}
              decay={2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0005}
            />

            {/* ターゲット（前壁の写真の高さに置く） */}
            <object3D
              ref={(el) => (targetRefs.current[i] = el)}
              position={[offset, eye - 0.05, targetRelZ]}
            />
          </group>
        );
      })}
    </group>
  );
}

function Frames({
  images,
  roomSize,
}: {
  images: ImageItem[];
  roomSize: { w: number; h: number; d: number };
}) {
  const gap = 2.6; // 額の間隔
  const frameW = 2.2; // 額の幅
  const frameH = 1.5; // 額の高さ
  const eye = 2.0; // 中心の高さ

  // 壁4面に均等配置（前→右→後→左 の順）
  const perWall = Math.ceil(images.length / 4);
  const walls = [
    {
      normal: new THREE.Vector3(0, 0, 1),
      posZ: -roomSize.d / 2 + 0.01,
      rotY: 0,
    }, // 前壁（手前から見て奥側）
    {
      normal: new THREE.Vector3(-1, 0, 0),
      posX: roomSize.w / 2 - 0.01,
      rotY: -Math.PI / 2,
    }, // 右壁
    {
      normal: new THREE.Vector3(0, 0, -1),
      posZ: roomSize.d / 2 - 0.01,
      rotY: Math.PI,
    }, // 後壁
    {
      normal: new THREE.Vector3(1, 0, 0),
      posX: -roomSize.w / 2 + 0.01,
      rotY: Math.PI / 2,
    }, // 左壁
  ];

  const items = images.map((img, i) => {
    const wallIdx = Math.floor(i / perWall);
    const onWallIdx = i % perWall;
    const wall = walls[Math.min(wallIdx, walls.length - 1)];

    const span = (perWall - 1) * gap;
    const offset = onWallIdx * gap - span / 2;

    let position: [number, number, number] = [0, eye, 0];
    if ((wall as any).posZ !== undefined)
      position = [offset, eye, (wall as any).posZ];
    if ((wall as any).posX !== undefined)
      position = [(wall as any).posX, eye, offset];

    return {
      ...img,
      position,
      rotation: [0, (wall as any).rotY, 0] as [number, number, number],
      normal: (wall as any).normal,
    };
  });

  return (
    <group>
      {items.map((it, idx) => (
        <Frame
          key={idx}
          url={it.url}
          title={it.title}
          author={it.author}
          position={it.position}
          rotation={it.rotation}
          normal={it.normal}
          size={[frameW, frameH]}
        />
      ))}
    </group>
  );
}

type FrameProps = {
  url: string;
  title?: string;
  author?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  normal: THREE.Vector3;
  size?: [number, number];
};

function Frame({
  url,
  title,
  author,
  position,
  rotation,
  normal,
  size = [2, 1.3],
}: FrameProps) {
  // useTexture の返り値はユニオンになりやすいので明示的に Texture として扱う
  const tex = useTexture(url) as unknown as THREE.Texture;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  // @ts-ignore: three の型によりプロパティが非推奨/存在しない場合があるがランタイムでは使用
  tex.anisotropy = 8;

  // 写真のアスペクト比に基づいてフレームサイズとラベル位置を計算
  const [dynamicSize, setDynamicSize] = useState([2.2, 1.5]);
  const [labelOffset, setLabelOffset] = useState(new THREE.Vector3());
  useEffect(() => {
    if (tex.image) {
      const img = tex.image as HTMLImageElement;
      const aspect = img.width / img.height;
      const maxSize = 2.2;
      let frameW, frameH;
      if (aspect > 1) {
        // 横長写真
        frameW = maxSize;
        frameH = maxSize / aspect;
      } else {
        // 縦長写真
        frameH = maxSize;
        frameW = maxSize * aspect;
      }
      setDynamicSize([frameW, frameH]);

      // ラベル位置の計算
      let offset = new THREE.Vector3();
      // ラベルを写真の下端の下に配置
      offset = normal
        .clone()
        .applyEuler(new THREE.Euler(0, -rotation[1], 0))
        .multiplyScalar(1.25);
      offset.y = -frameH / 2 - 0.3;
      setLabelOffset(offset);
    }
  }, [tex, normal, rotation]);

  const [w, h] = dynamicSize;

  const depth = 0.06;

  const bgRef = useRef<THREE.Mesh>(null);
  const paperRef = useRef<THREE.Mesh>(null);
  const photoRef = useRef<THREE.Mesh>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    if (photoRef.current && spotLightRef.current) {
      spotLightRef.current.target = photoRef.current;
    }
  }, []);

  return (
    <group position={position} rotation={rotation}>
      {/* 各写真にスポットライトを追加（天井から照らす） - 調整済み */}
      <spotLight
        ref={spotLightRef}
        position={[0, 2.2, 0.6]}
        intensity={3.2}
        angle={0.42}
        penumbra={0.6}
        distance={6}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
        shadow-radius={4}
      />
      {/* 光源の位置を示す小さな球（デバッグ用、視認性を下げるため薄め） */}
      <mesh position={[0, 2.2, 0.2]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="white" opacity={0.6} transparent />
      </mesh>
      {/* 額縁本体（RoundedBox で角を丸めて立体感を向上） */}
      <RoundedBox
        args={[w + 0.14, h + 0.14, depth]}
        radius={0.03}
        smoothness={6}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#111112" roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {/* 写真面（少し手前） */}
      <mesh ref={photoRef} position={[0, 0, depth / 2 + 0.001]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.9} metalness={0.0} />
      </mesh>
      {/* タイトルラベル（プレートに厚みを持たせ、紙っぽい質感を追加） */}
      {(title || author) && (
        <>
          {/* 背景プレート（薄い箱で厚みを表現） */}
          <group position={[labelOffset.x, labelOffset.y, depth + 0.01]}>
            <mesh ref={bgRef} castShadow receiveShadow>
              <boxGeometry args={[1.5, 0.3, 0.02]} />
              {/* 色をわずかに薄め、roughness を微調整して塊感を減らす */}
              <meshStandardMaterial
                color="#f3f0ea"
                roughness={0.72}
                metalness={0.02}
              />
            </mesh>
            {/* 紙面（ボードに貼られた紙のように少し前面に配置）。
                幅は troika Text の実寸に合わせて onSync でスケールする */}
            <mesh
              ref={paperRef}
              position={[0, 0, 0.013]}
              castShadow
              receiveShadow
            >
              <planeGeometry args={[1.28, 0.22]} />
              <meshStandardMaterial
                color="#fffdf8"
                roughness={0.92}
                metalness={0}
              />
            </mesh>
          </group>

          {/* troika Text を紙面の少し前に置く（読みやすさ優先） */}
          <Text
            position={[labelOffset.x, labelOffset.y, depth + 0.045]}
            fontSize={0.08}
            color="#111"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.002}
            outlineColor="#fff"
            // テキストの折り返し：最大幅を写真の幅に合わせる
            maxWidth={w}
            textAlign="center"
            lineHeight={1.05}
            onSync={(troika) => {
              if (
                bgRef.current &&
                troika.geometry &&
                troika.geometry.boundingBox
              ) {
                const bbox = troika.geometry.boundingBox;
                const width = bbox.max.x - bbox.min.x;
                const height = bbox.max.y - bbox.min.y;
                const padding = 0.08;
                // 背景プレートは boxGeometry なので scale の z は 1 のまま
                bgRef.current.scale.set(
                  (width + padding * 2) / 1.5,
                  (height + padding) / 0.3,
                  1
                );
                // 紙面（paperRef）はプレートと同じ実寸（幅・高さ）に合わせる
                if (paperRef.current) {
                  const basePaperW = 1.28;
                  const basePaperH = 0.22;
                  const plateWidth = width + padding * 2; // 実際のプレート幅
                  const plateHeight = height + padding; // 実際のプレート高さ
                  paperRef.current.scale.set(
                    plateWidth / basePaperW,
                    plateHeight / basePaperH,
                    1
                  );
                  // 中心がずれることがあるため位置をリセット
                  paperRef.current.position.x = 0;
                  paperRef.current.position.y = 0;
                  paperRef.current.position.z = 0.013;
                }
              }
            }}
          >
            {title ?? "Untitled"}
          </Text>
        </>
      )}
    </group>
  );
}

function PointerLookWalk({
  roomSize,
}: {
  roomSize?: { w: number; h: number; d: number };
}) {
  // シンプルな WASD 歩行（カメラ直接操作）
  const vel = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  // targetEuler を用意して、ドラッグ/ポインタロックでの入力をここに書き込み、
  // 毎フレーム現在の euler をスムージングして追従させる
  const targetEuler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  // 実際の移動速度（スムージング付き）
  const actualVel = useRef(new THREE.Vector3());
  const prevTargetPitch = useRef<number>(targetEuler.current.x);
  const prevCamPitch = useRef<number>(0);
  const keys = useRef<{ [k: string]: boolean }>({});
  const cam = useRef<THREE.PerspectiveCamera | null>(null);
  const initialY = useRef<number | null>(null);

  // キー入力イベントを登録（WASD で移動）。フォーカスやウィンドウが外れた時はクリアする。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // prevent typing into inputs when desired? keep simple: always record WASD
      if (
        e.code === "KeyW" ||
        e.code === "KeyA" ||
        e.code === "KeyS" ||
        e.code === "KeyD"
      ) {
        // デバッグ: キー入力が拾えているか確認
        // (開発時のみのログ、不要なら後で削除可能)
        keys.current[e.code] = true;
        // prevent page scrolling when space/arrow used? not needed here
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === "KeyW" ||
        e.code === "KeyA" ||
        e.code === "KeyS" ||
        e.code === "KeyD"
      ) {
        keys.current[e.code] = false;
      }
    };
    const onBlur = () => {
      keys.current = {};
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // マウント確認用ログ（コンポーネントが実際に描画されているか確認）
  useEffect(() => {}, []);

  // マウスドラッグでの視点回転（ポインタロックでない通常ドラッグ時）
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const baseSensitivity = 0.0015;

    const onDown = (e: MouseEvent) => {
      // キャプチャ段階で先に受け取り、他ハンドラによる制御を防ぐ
      try {
        e.preventDefault?.();
        // stopImmediatePropagation は同一要素の他のリスナも止める
        e.stopImmediatePropagation?.();
      } catch (err) {
        // ignore
      }
      if (document.pointerLockElement) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const sensitivity = document.pointerLockElement
        ? baseSensitivity * 2.2
        : baseSensitivity;
      // yaw と pitch を更新
      targetEuler.current.y -= dx * sensitivity;
      targetEuler.current.x += dy * sensitivity;
      // 移動中のログは大量に出るためここでは出力しない。
      // 必要なら閾値を設けて短時間に一度だけ出す実装に変更できます。
    };

    const onUp = () => {
      dragging = false;
    };

    // capture=true で先にハンドリングする（OrbitControls より先に受け取る）
    canvas.addEventListener("mousedown", onDown, { capture: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useFrame((state, dt) => {
    cam.current = state.camera as THREE.PerspectiveCamera;
    // OrbitControls が有効な場合は OrbitControls 側の回転を優先し、
    // 我々の euler/targetEuler をカメラ回転に同期して上書きを防ぐ。
    const orbitEnabled = false;
    if (orbitEnabled) {
      // Sync our targets to the camera so toggling between modes doesn't jump
      targetEuler.current.x = cam.current.rotation.x;
      targetEuler.current.y = cam.current.rotation.y;
      targetEuler.current.z = cam.current.rotation.z;
      euler.current.x = targetEuler.current.x;
      euler.current.y = targetEuler.current.y;
      euler.current.z = targetEuler.current.z;
    } else {
      // 毎フレーム euler を targetEuler に近づける（スムージング）
      // targetEuler の pitch を適切な範囲にクランプ
      targetEuler.current.x = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 6, targetEuler.current.x)
      );
      const smooth = 0.18; // 反応の速さ（大きいほど即時）
      function lerpAngle(a: number, b: number, t: number) {
        let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
        return a + d * t;
      }
      euler.current.x = lerpAngle(
        euler.current.x,
        targetEuler.current.x,
        smooth
      );
      euler.current.y = lerpAngle(
        euler.current.y,
        targetEuler.current.y,
        smooth
      );
      euler.current.z = lerpAngle(
        euler.current.z,
        targetEuler.current.z,
        smooth
      );
      cam.current.rotation.set(
        euler.current.x,
        euler.current.y,
        euler.current.z,
        "YXZ"
      );
    }

    // movement always active (no mode toggle required)

    // 初回フレームでカメラの高さを記憶しておき、水平方向のみの移動にする
    // 同時にカメラの現在の回転を targetEuler に同期しておく（回転の不整合を防ぐ）
    if (initialY.current === null && cam.current) {
      initialY.current = cam.current.position.y;
      // カメラの初期回転を targetEuler にコピー
      targetEuler.current.x = cam.current.rotation.x;
      targetEuler.current.y = cam.current.rotation.y;
      targetEuler.current.z = cam.current.rotation.z;
      // euler も即座に合わせておく
      euler.current.x = targetEuler.current.x;
      euler.current.y = targetEuler.current.y;
      euler.current.z = targetEuler.current.z;
    }

    // キー入力
    const speed = 4.0;
    vel.current.set(0, 0, 0);
    // W は前進、S は後退（カメラの向きに沿って進む）
    if (keys.current["KeyW"]) vel.current.z += 1;
    if (keys.current["KeyS"]) vel.current.z -= 1;
    if (keys.current["KeyA"]) vel.current.x -= 1;
    if (keys.current["KeyD"]) vel.current.x += 1;

    // カメラの向きに基づく前方ベクトルを取得（PointerLock でも Orbit でも共通）
    cam.current.getWorldDirection(dir.current);
    dir.current.y = 0; // 水平成分のみで移動させる
    dir.current.normalize();
    const right = new THREE.Vector3()
      .crossVectors(dir.current, new THREE.Vector3(0, 1, 0))
      .normalize();

    // 入力 vel をスムーズ化して actualVel に近づける
    // vel は -1..1 の入力値、actualVel は現在の滑らかな入力
    actualVel.current.lerp(vel.current, 0.18);

    const move = new THREE.Vector3();
    // allow independent tuning of forward/back vs strafe responsiveness
    const forwardWeight = 1.0;
    const strafeWeight = 1.4; // 横移動の重み
    move.addScaledVector(dir.current, actualVel.current.z * forwardWeight);
    move.addScaledVector(right, actualVel.current.x * strafeWeight);
    if (move.lengthSq() > 0.000001) {
      // 変更: 正規化してから速度を掛けると、斜め移動やストレイフの感覚が
      // 思った通りにならないため、正規化をやめて入力ベクトルの大きさを
      // 保ったままスカラーを掛ける（A/D の横移動が自然に効くようになる）
      move.multiplyScalar(
        speed * dt * (0.9 + actualVel.current.length() * 0.1)
      );
    } else {
      move.set(0, 0, 0);
    }

    // 位置更新（安全のため finite を確認）
    if (
      Number.isFinite(move.x) &&
      Number.isFinite(move.y) &&
      Number.isFinite(move.z)
    ) {
      cam.current.position.add(move);
      // 変更: カメラ移動時に OrbitControls の target を移動させない。
      // これによりカメラの立っている位置で左右を向ける（ファーストパーソン寄り）の
      // 回転が可能になる。必要なら後で target を滑らかに移動する実装を追加する。
    }

    // カメラの高さを固定して水平方向のみ移動する
    if (initialY.current !== null) {
      // 床（y=0）より下に入らないように最小高さを保証する
      const floorY = 0;
      const minHeight = Math.max(initialY.current, floorY + 1.2);
      // 天井より上にも出ないように最大高さを制限
      const maxHeight = roomSize ? roomSize.h - 0.5 : initialY.current;
      // 変更点: カメラの高さを厳密に固定（初期高さまたは min/max の範囲内）する。
      // これにより前進・左右移動で高さがずれて下がってしまう問題を解消する。
      const fixedY = Math.max(minHeight, Math.min(maxHeight, initialY.current));
      cam.current.position.y = fixedY;
    }

    // 部屋の内側に収まるよう X/Z をクランプ
    if (roomSize) {
      const margin = 0.9; // カメラから壁までの最小距離
      const halfW = roomSize.w / 2 - margin;
      const halfD = roomSize.d / 2 - margin;
      cam.current.position.x = Math.max(
        -halfW,
        Math.min(halfW, cam.current.position.x)
      );
      cam.current.position.z = Math.max(
        -halfD,
        Math.min(halfD, cam.current.position.z)
      );
    }

    // A/D 押下でカメラが回転してしまっているか検出するデバッグ。
    // 削除済み
  });

  return (
    <group>
      {/* PointerLockControls を削除、マウスドラッグで視線を動かす */}
    </group>
  );
}
