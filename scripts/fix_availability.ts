import { setAvailability } from '../src/lib/availability';
import { getActiveCommissionCount } from '../src/lib/commissions';

// Force update availability based on current active count
(async () => {
    const activeCount = await getActiveCommissionCount();
    console.log(`Current Active Count: ${activeCount}`);

    if (activeCount >= 2) {
        await setAvailability(false);
        console.log('Set availability to FALSE (Closed)');
    } else {
        await setAvailability(true);
        console.log('Set availability to TRUE (Open)');
    }
})();
