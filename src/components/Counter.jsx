import { useState } from 'react'
import { Rocket } from 'lucide-react'

const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <button
        className="btn btn-primary gap-2"
        onClick={() => setCount(c => c + 1)}
      >
        <Rocket size={16} />
        Clicked: {count}
      </button>
    </div>
  )
}

export default Counter
