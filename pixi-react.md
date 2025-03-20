extend
One of the most important concepts to understand with v8 is extend. Normally @pixi/react would have to import all pf Pixi.js to be able to provide the full library as JSX components. Instead, we use an internal catalogue of components populated by the extend API. This allows you to define exactly which parts of Pixi.js you want to import, keeping your bundle sizes small.

To allow @pixi/react to use a Pixi.js component, pass it to the extend API:

import {
    Application,
    extend,
} from '@pixi/react';
import { Container } from 'pixi.js';

extend({ Container });

const MyComponent = () => (
    <pixiContainer />
);




Getting Started
To add @pixi/react to an existing React application, install the necessary dependencies:

npm install pixi.js@^8.2.6 @pixi/react@beta

Does it have limitations?
None. Everything that works in Pixi.js will work here without exception.

Can it keep up with frequent feature updates to Pixi.js?
Yes. @pixi/react is a thin wrapper around Pixi.js, allowing it to be expressed via JSX. For example, <pixiSprite> is backed by a Pixi.js Sprite. If a feature is added, removed, or changed in Pixi.js, those changes will be available to you without updating @pixi/react.


Pixi.js Components
All Pixi.js classes should be available as components. They should also be included in your IDE's intellisense/autocomplete once you've installed/imported @pixi/react. So long as it's exported from Pixi.js, it's supported as a component with the pixi prefix. Here's a selection of commonly used components:

<pixiContainer />
<pixiGraphics />
<pixiSprite />
<pixiAnimatedSprite />
<pixiText />
<pixiHtmlText />

Additionally, all properties of Pixi.js classes are available as properties on these components.

<pixiContainer x={100} y={100}>
    <pixiSprite anchor={{ 0.5, 0.5 }} texture={texture} />
</pixiContainer>

Special Properties
Some components have special properties to support non-conforming APIs.

<pixiGraphics>
draw
draw takes a callback which receives the Graphics context. Drawing will happen on every tick.

<pixiGraphics draw={(graphics) => {
    graphics.clear();
    graphics.setFillStyle({ color: 'red' });
    graphics.rect(0, 0, 100, 100);
    graphics.fill();
}} />


useApplication
useApplication allows access to the parent PIXI.Application created by the <Application> component. This hook will not work outside of an <Application> component. Additionally, the parent application is passed via React Context. This means useApplication will only work appropriately in child components, and in the same component that creates the <Application>.

For example, the following example useApplication will not be able to access the parent application:

import {
    Application,
    useApplication,
} from '@pixi/react';

const MyComponent = () => {
    // This will cause an invariant violation.
    const { app } = useApplication();

    return <Application />;
};

Here's a working example where useApplication will be able to access the parent application:

import {
    Application,
    useApplication,
} from '@pixi/react';

const ChildComponent = () => {
    const { app } = useApplication();

    return <container />;
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);useExtend
useExtend allows the extend API to be used as a React hook. Additionally, the useExtend hook is memoised, while the extend function is not.

import {
    Application,
    useExtend,
} from '@pixi/react';
import { Container } from 'pixi.js';

function ChildComponent() {
    useExtend({ Container });

    return <pixiContainer />;
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);


useTick allows a callback to be attached to the Ticker on the parent application.

import {
    Application,
    useTick,
} from '@pixi/react';

const ChildComponent = () => {
    useTick(() => console.log('This will be logged on every tick'));
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);

useTick can also accept an options object. This allows control of all ticker.add options, as well as adding the isEnabled option. Setting isEnabled to false will cause the callback to be disabled until the argument is changed to true again.

import {
    Application,
    useTick,
} from '@pixi/react';
import { UPDATE_PRIORITY } from 'pixi.js'
import { useRef } from 'react'

const ChildComponent = () => {
    const spriteRef = useRef(null)

    useTick({
        callback() {
            // this === context
            this.current.rotation += 1
        },
        context: spriteRef,
        isEnabled: true,
        priority: UPDATE_PRIORITY.HIGH,
    })

    return <pixiSprite ref={spriteRef} />
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);

⚠️ WARNING ⚠️
The callback passed to useTick is not memoised. This can cause issues where your callback is being removed and added back to the ticker on every frame if you're mutating state in a component where useTick is using a non-memoised function. For example, this issue would affect the component below because we are mutating the state, causing the component to re-render constantly:

import {
    Application,
    useTick,
} from '@pixi/react';
import { useState } from 'react'

const ChildComponent = () => {
    const [rotation, setRotation] = useState(0)

    useTick(() => setRotation(previousState => previousState + 1));

    return <pixiSprite rotation={rotation} />;
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);

This issue can be solved by memoising the callback passed to useTick:

import {
    Application,
    useTick,
} from '@pixi/react';
import { useCallback, useState } from 'react'

const ChildComponent = () => {
    const [rotation, setRotation] = useState(0)

    const animateRotation = useCallback(() => setRotation(previousState => previousState + 1), []);

    useTick(animateRotation);

    return <pixiSprite rotation={rotation} />;
};

const MyComponent = () => (
    <Application>
        <ChildComponent />
    </Application>
);