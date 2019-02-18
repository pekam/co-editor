# \<co-editor\>

A web component for real-time collaborative text editing

## Running the Demo Server
```
npm install
npm run start
```

Open `localhost:8080`.

## Testing
Run the demo server and open `localhost:8080/test`.

## Background

#### Web Components

Web components are reusable custom HTML elements which encapsulate their content and styles inside a shadow DOM.

See https://developer.mozilla.org/en-US/docs/Web/Web_Components.

#### Consistency Maintenance in Real-Time Collaborative Editors

The component maintains consistent document states between collaborating users
by implementing the GOTO algorithm (General Operational Transformation Optimized),
based on research work by Chengzheng Sun et al.
```
[1] C. Sun, X. Jia, Y. Zhang, Y. Yang, and D. Chen,
    “Achieving convergence, causalitypreservation, and intention preservation in 
    real-time cooperative editing systems”, ACM Trans. Comput. -Hum. Interact., 
    vol. 5, no. 1, pp. 63–108, Mar. 1998.

[2] C. Sun and C. Ellis,
    “Operational transformation in real-time group editors: Is-sues, algorithms, 
    and achievements”, in Proceedings of the 1998 ACM Conferenceon Computer Supported 
    Cooperative Work, ser. CSCW ’98, Seattle, Washington, USA: ACM, 1998, pp. 59–68.
```