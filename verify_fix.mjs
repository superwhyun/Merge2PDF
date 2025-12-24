import { PDFDocument, degrees } from 'pdf-lib';

async function verify() {
    console.log('Verifying rotation normalization logic...');

    const doc = await PDFDocument.create();
    const page = doc.addPage();

    // Case 1: Standard object rotation
    page.setRotation(degrees(90));
    let rotation = page.getRotation();
    console.log('Case 1 (Object):', rotation);

    let angle = typeof rotation === 'object' && rotation !== null && 'angle' in rotation
        ? rotation.angle
        : (typeof rotation === 'number' ? rotation : 0);

    console.log('Normalized angle 1:', angle);

    try {
        page.setRotation(degrees(angle));
        console.log('Case 1: Re-applied successfully');
    } catch (e) {
        console.error('Case 1 Failed:', e);
    }

    // Case 2: Simulation of raw number (if possible to force, or just testing the logic path)
    // We can't easily force page.getRotation() to return a number if the library returns an object,
    // but we can test the logic block itself.

    const rawRotation = 180;
    const normalizedRaw = typeof rawRotation === 'object' && rawRotation !== null && 'angle' in rawRotation
        ? rawRotation.angle
        : (typeof rawRotation === 'number' ? rawRotation : 0);

    console.log('Normalized angle 2 (Raw Number):', normalizedRaw);

    if (normalizedRaw === 180) {
        console.log('Case 2: Logic handled number correctly');
    } else {
        console.error('Case 2: Logic failed to handle number');
    }

    console.log('Verification complete.');
}

verify();
