import {
	Position,
	TextDocument,
	SelectionRange,
} from 'vscode-languageserver';
import { SourceFile } from '../sourceFiles';

export function register(sourceFiles: Map<string, SourceFile>) {
	return (document: TextDocument, positions: Position[]) => {
		const sourceFile = sourceFiles.get(document.uri);
		if (!sourceFile) return;
		const ranges = positions.map(pos => ({ start: pos, end: pos }));

		const tsResult = getTsResult(sourceFile);
		const htmlResult = getHtmlResult(sourceFile);
		const cssResult = getCssResult(sourceFile);
		return [...cssResult, ...htmlResult, ...tsResult];

		function getTsResult(sourceFile: SourceFile) {
			let result: SelectionRange[] = [];
			for (const range of ranges) {
				for (const sourceMap of sourceFile.getTsSourceMaps()) {
					for (const tsLoc of sourceMap.findTargets(range)) {
						if (!tsLoc.data.capabilities.basic) continue;
						const selectRange = sourceMap.languageService.getSelectionRange(sourceMap.targetDocument, tsLoc.range.start);
						if (selectRange) {
							const vueLoc = sourceMap.findSource(selectRange.range);
							if (vueLoc) {
								result.push({
									range: vueLoc.range,
									// TODO: parent
								});
							}
						}
					}
				}
			}
			return result;
		}
		function getHtmlResult(sourceFile: SourceFile) {
			let result: SelectionRange[] = [];
			for (const range of ranges) {
				for (const sourceMap of sourceFile.getHtmlSourceMaps()) {
					for (const htmlLoc of sourceMap.findTargets(range)) {
						const selectRanges = sourceMap.languageService.getSelectionRanges(sourceMap.targetDocument, [htmlLoc.range.start]);
						for (const selectRange of selectRanges) {
							const vueLoc = sourceMap.findSource(selectRange.range);
							if (vueLoc) {
								result.push({
									range: vueLoc.range,
									// TODO: parent
								});
							}
						}
					}
				}
			}
			return result;
		}
		function getCssResult(sourceFile: SourceFile) {
			let result: SelectionRange[] = [];
			for (const range of ranges) {
				for (const sourceMap of sourceFile.getCssSourceMaps()) {
					for (const cssLoc of sourceMap.findTargets(range)) {
						const selectRanges = sourceMap.languageService.getSelectionRanges(sourceMap.targetDocument, [cssLoc.range.start], sourceMap.stylesheet);
						for (const selectRange of selectRanges) {
							const vueLoc = sourceMap.findSource(selectRange.range);
							if (vueLoc) {
								result.push({
									range: vueLoc.range,
									// TODO: parent
								});
							}
						}
					}
				}
			}
			return result;
		}
	}
}
