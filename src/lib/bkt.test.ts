import { calculateBKT, calculateCFS, BKT_PARAMS } from './bkt';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assertClose(actual: number, expected: number, tolerance = 0.0001, testName: string) {
    if (Math.abs(actual - expected) < tolerance) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - Expected ${expected}, got ${actual}`);
      failed++;
    }
  }

  console.log("--- Running BKT Tests ---");

  // Test 1: BKT Update on Correct Answer
  // P(L_0) = 0.10
  // P_T = 0.15, P_G = 0.20, P_S = 0.05
  // P(C_1) = 0.10 * (1 - 0.05) + (1 - 0.10) * 0.20 = 0.10 * 0.95 + 0.90 * 0.20 = 0.095 + 0.18 = 0.275
  // P(L_1 | Obs = 1) = (0.10 * 0.95) / 0.275 = 0.095 / 0.275 ≈ 0.34545
  // P(L_2) = 0.34545 + (1 - 0.34545) * 0.15 = 0.34545 + 0.65455 * 0.15 = 0.34545 + 0.09818 = 0.44363
  
  const expectedCorrectUpdate = 0.443636;
  const actualCorrectUpdate = calculateBKT(BKT_PARAMS.P_L0, 1);
  assertClose(actualCorrectUpdate, expectedCorrectUpdate, 0.0001, "Calculate BKT - Correct Observation");

  // Test 2: BKT Update on Incorrect Answer
  // P(L_1 | Obs = 0) = (0.10 * 0.05) / (1 - 0.275) = 0.005 / 0.725 ≈ 0.006896
  // P(L_2) = 0.006896 + (1 - 0.006896) * 0.15 = 0.006896 + 0.99310 * 0.15 = 0.006896 + 0.14896 = 0.15586
  const expectedIncorrectUpdate = 0.155862;
  const actualIncorrectUpdate = calculateBKT(BKT_PARAMS.P_L0, 0);
  assertClose(actualIncorrectUpdate, expectedIncorrectUpdate, 0.0001, "Calculate BKT - Incorrect Observation");


  // Test 3: CFS Calculation
  // TTFA = 30000 (0.5 min), HP = 2, AF = 1
  // CFS = (30000 / 60000)*0.4 + (2 / 5)*0.35 + (1 / 4)*0.25
  // CFS = 0.5 * 0.4 + 0.4 * 0.35 + 0.25 * 0.25 = 0.20 + 0.14 + 0.0625 = 0.4025
  const actualCFS = calculateCFS(30000, 2, 1);
  assertClose(actualCFS, 0.4025, 0.0001, "Calculate CFS - Normal values");

  // Test 4: CFS max boundary
  // High values should cap at 1.0
  const actualCFSHigh = calculateCFS(120000, 10, 10);
  assertClose(actualCFSHigh, 1.0, 0.0001, "Calculate CFS - Maxes out at 1.0");

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

// Run if executed directly
if (require.main === module) {
  runTests();
}
