import React from "react";

import "./Split.scss"

export default function Split(payload) {
  return (
    <div className="split">
      <div className="splitLeft">
        {payload.title && (<p className="splitTitle"> {payload.title} </p>)}
        {payload.date && (<p className="splitDate"> {payload.date} </p>)}
        {payload.time && (<p className="splitTime"> {payload.time} </p>)}
      </div>
      <div className="splitRight">
        {payload.image && (<p className="splitBody">  </p> )}
        {payload.body && (<p className="splitBody"> {payload.body} </p> )}
        {payload.address1 && (<p className="address"> {payload.address1} </p> )}
        {payload.address2 && (<p className="address"> {payload.address2} </p> )}
      </div>
    </div>
  )
}