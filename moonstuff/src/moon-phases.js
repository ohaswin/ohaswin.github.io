window.moon = {
    phases: [
        { name: "New Moon", start: 0, end: 0.03, poetry: "darkness whispers", cultural: "the hidden moon" },
        { name: "Waxing Crescent", start: 0.03, end: 0.22, poetry: "silver blade emerges", cultural: "first light" },
        { name: "First Quarter", start: 0.22, end: 0.28, poetry: "half truth revealed", cultural: "decision moon" },
        { name: "Waxing Gibbous", start: 0.28, end: 0.47, poetry: "swelling promise", cultural: "growing power" },
        { name: "Full Moon", start: 0.47, end: 0.53, poetry: "luminous perfection", cultural: "the mother moon" },
        { name: "Waning Gibbous", start: 0.53, end: 0.72, poetry: "gentle decline", cultural: "wisdom keeper" },
        { name: "Last Quarter", start: 0.72, end: 0.78, poetry: "releasing shadow", cultural: "forgiveness moon" },
        { name: "Waning Crescent", start: 0.78, end: 0.97, poetry: "final breath", cultural: "crone's wisdom" },
        { name: "New Moon", start: 0.97, end: 1, poetry: "into the void", cultural: "new beginning" },
    ],

    getPhaseName(fraction) {
        const phase = this.phases.find(p => fraction >= p.start && fraction < p.end);
        return phase ? phase.name : "";
    },

    createMoonSvg(fraction, phaseName) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 200 200");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("class", "moon-svg");

        const defs = document.createElementNS(svgNS, "defs");
        
        // Create unique IDs
        const gradientId = `moon-grad-${Math.random().toString(36).substr(2, 9)}`;
        
        // Textured moon surface gradient with realistic variations
        const radialGradient = document.createElementNS(svgNS, "radialGradient");
        radialGradient.setAttribute("id", gradientId);
        radialGradient.setAttribute("cx", "35%");
        radialGradient.setAttribute("cy", "25%");
        
        // Multi-stop gradient for realistic moon surface texture
        const stop1 = document.createElementNS(svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("style", "stop-color:#ffffff;stop-opacity:1");
        
        const stop2 = document.createElementNS(svgNS, "stop");
        stop2.setAttribute("offset", "30%");
        stop2.setAttribute("style", "stop-color:#f8fafc;stop-opacity:1");
        
        const stop3 = document.createElementNS(svgNS, "stop");
        stop3.setAttribute("offset", "60%");
        stop3.setAttribute("style", "stop-color:#e2e8f0;stop-opacity:1");
        
        const stop4 = document.createElementNS(svgNS, "stop");
        stop4.setAttribute("offset", "85%");
        stop4.setAttribute("style", "stop-color:#cbd5e1;stop-opacity:1");
        
        const stop5 = document.createElementNS(svgNS, "stop");
        stop5.setAttribute("offset", "100%");
        stop5.setAttribute("style", "stop-color:#94a3b8;stop-opacity:1");
        
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        radialGradient.appendChild(stop3);
        radialGradient.appendChild(stop4);
        radialGradient.appendChild(stop5);
        defs.appendChild(radialGradient);
        
        // Add noise pattern for surface texture
        const noisePatternId = `noise-${Math.random().toString(36).substr(2, 9)}`;
        const noiseFilter = document.createElementNS(svgNS, "filter");
        noiseFilter.setAttribute("id", noisePatternId);
        noiseFilter.setAttribute("x", "0%");
        noiseFilter.setAttribute("y", "0%");
        noiseFilter.setAttribute("width", "100%");
        noiseFilter.setAttribute("height", "100%");
        
        const turbulence = document.createElementNS(svgNS, "feTurbulence");
        turbulence.setAttribute("baseFrequency", "0.9");
        turbulence.setAttribute("numOctaves", "3");
        turbulence.setAttribute("result", "noise");
        turbulence.setAttribute("seed", "2");
        
        const displacementMap = document.createElementNS(svgNS, "feDisplacementMap");
        displacementMap.setAttribute("in", "SourceGraphic");
        displacementMap.setAttribute("in2", "noise");
        displacementMap.setAttribute("scale", "2");
        
        const composite = document.createElementNS(svgNS, "feComposite");
        composite.setAttribute("operator", "multiply");
        composite.setAttribute("in2", "noise");
        composite.setAttribute("result", "textured");
        
        const blend = document.createElementNS(svgNS, "feBlend");
        blend.setAttribute("mode", "overlay");
        blend.setAttribute("in", "SourceGraphic");
        blend.setAttribute("in2", "textured");
        blend.setAttribute("result", "final");
        
        noiseFilter.appendChild(turbulence);
        noiseFilter.appendChild(displacementMap);
        noiseFilter.appendChild(composite);
        noiseFilter.appendChild(blend);
        defs.appendChild(noiseFilter);

        svg.appendChild(defs);

        // Moon base circle (dark side)
        const moonBase = document.createElementNS(svgNS, "circle");
        moonBase.setAttribute("cx", "100");
        moonBase.setAttribute("cy", "100");
        moonBase.setAttribute("r", "85");
        moonBase.setAttribute("fill", "#111111");
        moonBase.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
        moonBase.setAttribute("stroke-width", "1");
        svg.appendChild(moonBase);

        // Calculate illuminated portion
        const centerX = 100;
        const centerY = 100;
        const radius = 85;

        // Simple approach: show illuminated portion with curved visual effect
        if (fraction > 0.01) {
            const moonWidth = radius * 2;
            const illuminatedWidth = moonWidth * fraction;
            
            // Create clip path for moon circle
            const clipId = `moon-clip-${Math.random().toString(36).substr(2, 9)}`;
            const clipPath = document.createElementNS(svgNS, "clipPath");
            clipPath.setAttribute("id", clipId);
            
            const clipCircle = document.createElementNS(svgNS, "circle");
            clipCircle.setAttribute("cx", centerX);
            clipCircle.setAttribute("cy", centerY);
            clipCircle.setAttribute("r", radius);
            clipPath.appendChild(clipCircle);
            defs.appendChild(clipPath);
            
            // Create illuminated area using curved path instead of rectangle
            const illuminatedPath = document.createElementNS(svgNS, "path");
            
            // Calculate terminator position
            const terminatorX = centerX - radius + illuminatedWidth;
            
            // Create curved path for realistic moon terminator
            let pathD;
            if (fraction < 0.2) {
                // Small crescents - give more space to white area with gentler curve
                const curveDepth = Math.min(radius * 0.4, illuminatedWidth * 0.3); // Less aggressive curve
                const curveControlX = terminatorX + curveDepth * 0.3; // Push curve outward for more space
                
                pathD = `M ${centerX - radius} ${centerY - radius} 
                        L ${terminatorX} ${centerY - radius}
                        Q ${curveControlX} ${centerY} ${terminatorX} ${centerY + radius}
                        L ${centerX - radius} ${centerY + radius}
                        Z`;
            } else if (fraction >= 0.95) {
                // Near full moon - just use rectangle
                pathD = `M ${centerX - radius} ${centerY - radius} 
                        L ${terminatorX} ${centerY - radius}
                        L ${terminatorX} ${centerY + radius}
                        L ${centerX - radius} ${centerY + radius}
                        Z`;
            } else {
                // Normal phases - curved terminator
                const curveDepth = Math.min(radius * 0.3, illuminatedWidth * 0.2);
                pathD = `M ${centerX - radius} ${centerY - radius} 
                        L ${terminatorX - curveDepth} ${centerY - radius}
                        Q ${terminatorX + curveDepth * 0.5} ${centerY} ${terminatorX - curveDepth} ${centerY + radius}
                        L ${centerX - radius} ${centerY + radius}
                        Z`;
            }
            
            illuminatedPath.setAttribute("d", pathD);
            illuminatedPath.setAttribute("fill", `url(#${gradientId})`);
            illuminatedPath.setAttribute("clip-path", `url(#${clipId})`);
            illuminatedPath.setAttribute("filter", `url(#${noisePatternId})`);
            svg.appendChild(illuminatedPath);

            // Add craters for visible phases
            if (fraction > 0.1) {
                this.addMinimalCraters(svg, svgNS, fraction);
            }
        }

        return svg;
    },

    addMinimalCraters(svg, svgNS, fraction) {
        const craters = [
            { x: 120, y: 85, r: 4, depth: 0.4 },
            { x: 95, y: 115, r: 3, depth: 0.3 },
            { x: 110, y: 110, r: 2, depth: 0.5 },
            { x: 130, y: 95, r: 1.5, depth: 0.2 },
            { x: 85, y: 90, r: 2.5, depth: 0.35 },
            { x: 105, y: 125, r: 1, depth: 0.6 }
        ];

        craters.forEach(crater => {
            // Create crater with radial gradient for 3D effect
            const craterId = `crater-${Math.random().toString(36).substr(2, 9)}`;
            const craterGradient = document.createElementNS(svgNS, "radialGradient");
            craterGradient.setAttribute("id", craterId);
            craterGradient.setAttribute("cx", "30%");
            craterGradient.setAttribute("cy", "30%");
            
            const craterStop1 = document.createElementNS(svgNS, "stop");
            craterStop1.setAttribute("offset", "0%");
            craterStop1.setAttribute("style", `stop-color:#666666;stop-opacity:${crater.depth * 0.8}`);
            
            const craterStop2 = document.createElementNS(svgNS, "stop");
            craterStop2.setAttribute("offset", "70%");
            craterStop2.setAttribute("style", `stop-color:#333333;stop-opacity:${crater.depth}`);
            
            const craterStop3 = document.createElementNS(svgNS, "stop");
            craterStop3.setAttribute("offset", "100%");
            craterStop3.setAttribute("style", "stop-color:#111111;stop-opacity:0.1");
            
            craterGradient.appendChild(craterStop1);
            craterGradient.appendChild(craterStop2);
            craterGradient.appendChild(craterStop3);
            svg.querySelector('defs').appendChild(craterGradient);
            
            const craterCircle = document.createElementNS(svgNS, "circle");
            craterCircle.setAttribute("cx", crater.x);
            craterCircle.setAttribute("cy", crater.y);
            craterCircle.setAttribute("r", crater.r);
            craterCircle.setAttribute("fill", `url(#${craterId})`);
            svg.appendChild(craterCircle);
            
            // Add rim highlight for larger craters
            if (crater.r > 2) {
                const rimHighlight = document.createElementNS(svgNS, "circle");
                rimHighlight.setAttribute("cx", crater.x - crater.r * 0.2);
                rimHighlight.setAttribute("cy", crater.y - crater.r * 0.2);
                rimHighlight.setAttribute("r", crater.r * 1.1);
                rimHighlight.setAttribute("fill", "none");
                rimHighlight.setAttribute("stroke", "rgba(255, 255, 255, 0.15)");
                rimHighlight.setAttribute("stroke-width", "0.5");
                svg.appendChild(rimHighlight);
            }
        });
    }
};
