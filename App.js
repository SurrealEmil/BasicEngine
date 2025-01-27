// module aliases
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

// create an engine
const engine = Engine.create();

// Set gravity to 0 to remove the gravitational pull
engine.world.gravity.x = 0;
engine.world.gravity.y = 0;

// Define new game map size (wider and taller)
const worldWidth = window.innerWidth;
const worldHeight = window.innerHeight;

// create a renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: worldWidth,
        height: worldHeight
    }
});

// Set CSS to center the canvas
render.canvas.style.position = 'absolute';
render.canvas.style.top = '50%';
render.canvas.style.left = '50%';
render.canvas.style.transform = 'translate(-50%, -50%)';

// create paddles and ball
const paddleWidth = 20; // Narrow width for vertical paddles
const paddleHeight = 150; // Taller height for vertical paddles
const ballRadius = 10;

// Ball speed control constant
const initialBallSpeed = 10; // Initial speed of the ball
let ballSpeed = initialBallSpeed; // Current speed of the ball
const speedIncrement = 0.5; // How much to increase the speed after every paddle hit

// Left paddle (Player 1)
const leftPaddle = Bodies.rectangle(150, worldHeight / 2, paddleWidth, paddleHeight, { isStatic: true });
// Right paddle (Player 2)
const rightPaddle = Bodies.rectangle(worldWidth - 150, worldHeight / 2, paddleWidth, paddleHeight, { isStatic: true });
// Ball
const ball = Bodies.circle(worldWidth / 2, worldHeight / 2, ballRadius, { 
    restitution: 1, // Makes the ball bounce off surfaces
    friction: 0,    // Removes friction for smooth motion
    frictionAir: 0  // Reduces air resistance for the ball
});

// Add paddles and ball to the world
Composite.add(engine.world, [leftPaddle, rightPaddle, ball]);

// Create the floor and ceiling (walls)
const ground = Bodies.rectangle(worldWidth / 2, worldHeight + 30, worldWidth, 60, { isStatic: true });
const ceiling = Bodies.rectangle(worldWidth / 2, -30, worldWidth, 60, { isStatic: true });
Composite.add(engine.world, [ground, ceiling]);

// Give the ball an initial velocity with the initialBallSpeed constant
Matter.Body.setVelocity(ball, { x: initialBallSpeed, y: initialBallSpeed });

// Function to reset ball position and velocity
function resetBall() {
    // Reset the ball speed to the initial value
    ballSpeed = initialBallSpeed;

    // Reset ball position to the center
    Body.setPosition(ball, { x: worldWidth / 2, y: worldHeight / 2 });
    
    // Reset ball velocity to a random direction with the initial ballSpeed
    const randomX = Math.random() < 0.5 ? ballSpeed : -ballSpeed; // Random direction for X
    const randomY = Math.random() < 0.5 ? ballSpeed : -ballSpeed; // Random direction for Y
    Matter.Body.setVelocity(ball, { x: randomX, y: randomY });
}

// Function to keep the ball speed consistent
function maintainBallSpeed() {
    const speedMagnitude = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2); // Current speed magnitude
    if (speedMagnitude !== ballSpeed) {
        const scale = ballSpeed / speedMagnitude; // Scale factor to maintain speed
        Matter.Body.setVelocity(ball, {
            x: ball.velocity.x * scale,
            y: ball.velocity.y * scale
        });
    }
}

// Check if ball goes off-screen
function checkBallOutOfBounds() {
    if (ball.position.x < 0 || ball.position.x > worldWidth) { // If the ball is outside screen horizontally
        resetBall();
    }
}

// Control movement of paddles
let moveLeftPaddle = 0; // Vertical speed for left paddle
let moveRightPaddle = 0; // Vertical speed for right paddle

const speed = 10; // Movement speed for paddles
const minY = 80; // Minimum Y position for paddles (just below the ceiling)
const maxY = worldHeight - 80; // Maximum Y position for paddles (just above the ground)

// Function to update paddle positions smoothly
function updatePaddleMovement() {
    if (moveLeftPaddle !== 0) {
        const newY = Math.max(minY, Math.min(maxY, leftPaddle.position.y + moveLeftPaddle));
        Body.setPosition(leftPaddle, { x: leftPaddle.position.x, y: newY });
    }
    if (moveRightPaddle !== 0) {
        const newY = Math.max(minY, Math.min(maxY, rightPaddle.position.y + moveRightPaddle));
        Body.setPosition(rightPaddle, { x: rightPaddle.position.x, y: newY });
    }
}

// Add collision event listener
Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if ((bodyA === ball && (bodyB === leftPaddle || bodyB === rightPaddle)) ||
            (bodyB === ball && (bodyA === leftPaddle || bodyA === rightPaddle))) {
            
            const paddle = bodyA === ball ? bodyB : bodyA; // Determine which paddle was hit

            // Calculate the collision point relative to the paddle's center
            const relativeY = ball.position.y - paddle.position.y;
            const normalizedRelativeY = relativeY / (paddleHeight / 2); // Normalize (-1 to 1)

            // Adjust ball velocity based on the collision point
            const newVelocityX = ball.velocity.x > 0 ? ballSpeed : -ballSpeed; // Maintain horizontal speed
            const newVelocityY = normalizedRelativeY * ballSpeed; // Adjust vertical speed based on collision point

            // Increase the ball speed
            ballSpeed += speedIncrement;

            // Apply the new velocity
            Matter.Body.setVelocity(ball, { x: newVelocityX, y: newVelocityY });
        }
    });
});

// Event listeners for paddle movement
document.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        moveLeftPaddle = -speed; // Move left paddle up
    }
    if (event.key === 's') {
        moveLeftPaddle = speed; // Move left paddle down
    }
    if (event.key === 'ArrowUp') {
        moveRightPaddle = -speed; // Move right paddle up
    }
    if (event.key === 'ArrowDown') {
        moveRightPaddle = speed; // Move right paddle down
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 's') {
        moveLeftPaddle = 0; // Stop left paddle
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        moveRightPaddle = 0; // Stop right paddle
    }
});

// run the renderer
Render.run(render);

// create and run the runner
const runner = Runner.create();
Runner.run(runner, engine);

// Continuously check if the ball goes off-screen and reset if necessary
setInterval(() => {
    checkBallOutOfBounds();
    maintainBallSpeed(); // Keep ball speed consistent
    updatePaddleMovement(); // Smoothly update paddle positions
}, 16); // 60 FPS (approximately 16ms per frame)
