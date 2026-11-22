// Remove repeated event arrays from generated samples. Keep the complete final event array.
import { readFile, writeFile } from 'node:fs/promises'
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(await readFile(file, 'utf8'))
  for (const sample of data.samples) {
    sample.eventCount = sample.events?.length ?? sample.eventCount
    delete sample.events
  }
  data.sample_event_arrays = 'The final sample preserves the complete event list. Earlier samples retain event counts.'
  await writeFile(file, JSON.stringify(data, null, 2) + '\n')
  console.log(file, data.samples.length)
}
