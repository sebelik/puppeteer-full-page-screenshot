/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
import merge from 'merge-img';
import Jimp from 'jimp';

const fullPageScreenshot = async ( page, options = {} ) => {
    const { pagesCount, extraPixels, viewport } = await page.evaluate( () => {

		// Calculate page height based on the offset height of the body element and 
		// the largest nested element
		let pageHeight = document.body.offsetHeight

		const els = document.querySelectorAll(`body *`)
		for (var i = 0; i < els.length; i++) {
			pageHeight = Math.max(els[i].clientHeight, pageHeight);
		}

        window.scrollTo( 0, 0 );
        return {
            pagesCount: Math.ceil( pageHeight / window.innerHeight ),
            extraPixels: pageHeight % window.innerHeight * window.devicePixelRatio,
            viewport: { height: window.innerHeight * window.devicePixelRatio, width: window.innerWidth * window.devicePixelRatio },
		};
		
    } );

    const images = [];
    for ( let index = 0; index < pagesCount; index += 1 ) {

        if ( options.delay ) {
            await page.waitFor( options.delay );
		}
		
		const image = await page.screenshot( { fullPage: false } );
		
        await page.evaluate( () => {
			window.scrollBy( 0, window.innerHeight );		
		} )

        images.push( image );
    }

    if ( pagesCount === 1 ) {
        const image = await Jimp.read( images[0] );
        if ( options.path ) image.write( options.path );
        return image;
    }
    // crop last image extra pixels
    const cropped = await Jimp.read( images.pop() )
        .then( image => image.crop( 0, viewport.height - extraPixels, viewport.width, extraPixels ) )
        .then( image => image.getBufferAsync( Jimp.AUTO ) );

    images.push( cropped );
    const mergedImage = await merge( images, { direction: true } );
    if ( options.path ) mergedImage.write( options.path );

    return mergedImage;
};

export default fullPageScreenshot;
