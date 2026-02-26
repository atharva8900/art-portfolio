const fs = require('fs');
const path = require('path');

// Mock data generator
const createCommissions = (count, status) => {
    return Array(count).fill(null).map((_, i) => ({
        id: `mock-${i}`,
        status: status,
        submitted_at: new Date().toISOString()
    }));
};

// Logic from src/lib/commissions.ts
function getActiveWorkloadCount(commissions) {
    return commissions.filter(c =>
        c.status === 'pending' ||
        c.status === 'accepted' ||
        c.status === 'waitlist'
    ).length;
}

// Logic from src/lib/availability.ts
function getStatus(activeCount) {
    if (activeCount >= 5) return 'closed';
    if (activeCount >= 2) return 'waitlist';
    return 'open';
}

// Test Cases
const scenarios = [
    { name: '0 Active', counts: { pending: 0, accepted: 0, waitlist: 0, completed: 5 }, expected: 'open' },
    { name: '1 Active', counts: { pending: 1, accepted: 0, waitlist: 0, completed: 2 }, expected: 'open' },
    { name: '2 Active (Threshold)', counts: { pending: 2, accepted: 0, waitlist: 0 }, expected: 'waitlist' },
    { name: '4 Active (Max Waitlist)', counts: { pending: 2, accepted: 2, waitlist: 0 }, expected: 'waitlist' },
    { name: '5 Active (Closed)', counts: { pending: 2, accepted: 3, waitlist: 0 }, expected: 'closed' },
    { name: 'Mixed Status (Closed)', counts: { pending: 1, accepted: 1, waitlist: 3, completed: 10, rejected: 5 }, expected: 'closed' } // 5 active
];

console.log('--- Verifying Commission Logic ---\n');

let allPassed = true;

scenarios.forEach(scenario => {
    let commissions = [];
    Object.entries(scenario.counts).forEach(([status, count]) => {
        commissions = commissions.concat(createCommissions(count, status));
    });

    const activeCount = getActiveWorkloadCount(commissions);
    const status = getStatus(activeCount);

    const passed = status === scenario.expected;
    if (!passed) allPassed = false;

    console.log(`Scenario: ${scenario.name}`);
    console.log(`  Counts: ${JSON.stringify(scenario.counts)}`);
    console.log(`  Active Workload: ${activeCount}`);
    console.log(`  Result Status: ${status}`);
    console.log(`  Expected: ${scenario.expected}`);
    console.log(`  Test: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('---');
});

if (allPassed) {
    console.log('\n✅ All logic tests passed.');
} else {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
}
