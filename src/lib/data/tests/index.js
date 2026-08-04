export const testManifest = [
  {
    id: "p1_pediatria_t9ab_sbc_2026_1",
    title: "P1 PEDIATRIA T9A/B SBC 2026.1",
    file: () => import("./p1_pediatria_t9ab_sbc_2026_1.json"),
  },
  {
    id: "p2_pediatria_t9ab_sbc_2026_1",
    title: "P2 PEDIATRIA T9A/B SBC 2026.1",
    file: () => import("./p2_pediatria_t9ab_sbc_2026_1.json"),
  },
  {
    id: "p1_ped_t5b_17_11_2023",
    title: "P1 PED - T5B - 17/11/2023",
    file: () => import("./p1_ped_t5b_17_11_2023.json"),
  },
  // Add more tests here later, following the same shape
];
