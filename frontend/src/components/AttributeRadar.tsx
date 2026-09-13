import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { Attributes } from '../types/player'

interface Props {
  attributes: Attributes
  color?: string
}

export default function AttributeRadar({ attributes, color = '#00D9A3' }: Props) {
  const data = [
    { attr: 'PAC', value: attributes.pac },
    { attr: 'SHO', value: attributes.sho },
    { attr: 'PAS', value: attributes.pas },
    { attr: 'DRI', value: attributes.dri },
    { attr: 'DEF', value: attributes.def },
    { attr: 'PHY', value: attributes.phy },
  ]

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#232B36" />
          <PolarAngleAxis
            dataKey="attr"
            tick={{ fill: '#7C8A99', fontSize: 12, fontFamily: 'JetBrains Mono' }}
          />
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
