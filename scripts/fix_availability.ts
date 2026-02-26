import { setAvailability } from '../src/lib/availability';
import { getActiveCommissionCount } from '../src/lib/commissions';

// Force update availability based on current active count
const activeCount = getActiveCommissionCount();
console.log(`Current Active Count: ${activeCount}`);

if (activeCount >= 2) {
    setAvailability(false);
    console.log('Set availability to FALSE (Closed)');
} else {
    setAvailability(true);
    console.log('Set availability to TRUE (Open)');
}
