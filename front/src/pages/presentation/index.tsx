import { Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";

const TOTAL_SLIDES = 9;

export default function PresentationPage() {
	const [current, setCurrent] = useState(0);

	const goTo = useCallback((index: number) => {
		if (index >= 0 && index < TOTAL_SLIDES) setCurrent(index);
	}, []);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === " ") {
				e.preventDefault();
				goTo(current + 1);
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				goTo(current - 1);
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [current, goTo]);

	// Touch swipe
	useEffect(() => {
		let startX = 0;
		const onStart = (e: TouchEvent) => {
			startX = e.changedTouches[0].screenX;
		};
		const onEnd = (e: TouchEvent) => {
			const diff = e.changedTouches[0].screenX - startX;
			if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? -1 : 1));
		};
		window.addEventListener("touchstart", onStart);
		window.addEventListener("touchend", onEnd);
		return () => {
			window.removeEventListener("touchstart", onStart);
			window.removeEventListener("touchend", onEnd);
		};
	}, [current, goTo]);

	return (
		<div className="fixed inset-0 z-[9999] bg-background text-foreground overflow-hidden font-sans">
			{/* Slide 1: Title */}
			<Slide index={0} current={current} className="text-center">
				<h1 className="text-6xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent mb-6">
					Todo App
				</h1>
				<p className="text-2xl md:text-3xl text-muted-foreground font-light mb-12">
					AI駆動のフルスタック タスク管理アプリケーション
				</p>
				<p className="text-sm md:text-base text-muted-foreground/70">
					<strong className="text-foreground font-medium">
						技術ポートフォリオ
					</strong>{" "}
					— アーキテクチャと設計判断
				</p>
			</Slide>

			{/* Slide 2: Overview */}
			<Slide index={1} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Overview
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					何を
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						つくったか
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					<strong className="text-indigo-400 font-medium">
						生成AIとの対話
					</strong>
					でタスクを管理できる
					<strong className="text-indigo-400 font-medium">
						フルスタックWebアプリ
					</strong>
					。
					<br />
					<strong className="text-indigo-400 font-medium">
						日々の生産性を可視化
					</strong>
					するアナリティクス機能を備える。
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
					<Card icon="💬" title="AI 会話型タスク管理">
						<strong className="text-indigo-400 font-medium">
							自然言語でタスクのCRUD
						</strong>
						、サブタスク分解、リスケジュールをAIに指示。Spring AI + Gemini API。
					</Card>
					<Card icon="🍅" title="ポモドーロ & 集中セッション">
						カスタマイズ可能なポモドーロタイマー。集中時間を自動記録し、
						<strong className="text-indigo-400 font-medium">
							実績データを蓄積
						</strong>
						。
					</Card>
					<Card icon="📊" title="アナリティクス">
						日・週・月単位のKPI集計。見積精度、カテゴリ分析、
						<strong className="text-indigo-400 font-medium">
							生産性トレンドをチャート表示
						</strong>
						。
					</Card>
					<Card icon="📅" title="カレンダー">
						タスクをカレンダー上にドラッグ＆ドロップで配置。
						<strong className="text-indigo-400 font-medium">
							スケジュールの俯瞰管理
						</strong>
						が可能。
					</Card>
					<Card icon="🔐" title="OAuth2 / Auth0 認証">
						BFFパターンによるトークン管理。フロントにトークンを露出させない
						<strong className="text-indigo-400 font-medium">
							セキュアな設計
						</strong>
						。
					</Card>
					<Card icon="🚀" title="Railway デプロイ">
						Docker Compose による開発環境。Railway上に
						<strong className="text-indigo-400 font-medium">
							コンテナベースで本番デプロイ
						</strong>
						。
					</Card>
				</div>
			</Slide>

			{/* Slide 3: Architecture */}
			<Slide index={2} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Architecture
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					システム
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						アーキテクチャ
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					BFF パターンを採用し、認証トークンをフロントエンドに露出させない構成
				</p>
				<div className="w-full max-w-[90rem] mx-auto overflow-x-auto pb-6 mt-4 flex justify-center">
					<div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-x-4 gap-y-8 items-center justify-center min-w-[1000px]">
						{/* ROW 1: Main Flow */}
						<div className="col-start-1 row-start-1">
							<ArchBox
								label="Client"
								name="React SPA"
								tech="Vite + TypeScript"
							/>
						</div>

						<div className="col-start-2 row-start-1 flex flex-col items-center text-muted-foreground px-4">
							<span className="text-xs mb-1 font-mono whitespace-nowrap">
								HTTPS
							</span>
							<span className="text-3xl font-light leading-none text-indigo-400">
								→
							</span>
							<span className="text-xs mt-1 opacity-70 whitespace-nowrap">
								Nginx/Railway
							</span>
						</div>

						<div className="col-start-3 row-start-1">
							<ArchBox
								label="BFF"
								name="Spring Boot"
								tech="OAuth2 Client"
								accent
							/>
						</div>

						<div className="col-start-4 row-start-1 flex flex-col items-center text-muted-foreground px-4">
							<span className="text-xs mb-1 font-mono whitespace-nowrap">
								Access Token
							</span>
							<span className="text-3xl font-light leading-none text-indigo-400">
								→
							</span>
							<span className="text-xs mt-1 opacity-70 whitespace-nowrap">
								内部通信
							</span>
						</div>

						<div className="col-start-5 row-start-1">
							<ArchBox
								label="Resource Server"
								name="Spring Boot"
								tech="REST API"
								accent
							/>
						</div>

						<div className="col-start-6 row-start-1 flex flex-col items-center text-muted-foreground px-4">
							<span className="text-xs mb-1 font-mono whitespace-nowrap">
								API
							</span>
							<span className="text-3xl font-light leading-none text-indigo-400">
								↔
							</span>
						</div>

						<div className="col-start-7 row-start-1 flex flex-col gap-4">
							<ArchBox
								label="External"
								name="Google Gemini"
								tech="Spring AI 1.1"
							/>
						</div>

						{/* ROW 2: Vertical Arrows */}
						<div className="col-start-3 row-start-2 flex justify-center text-muted-foreground h-6">
							<span className="text-3xl font-light leading-none text-indigo-400">
								↕
							</span>
						</div>

						<div className="col-start-5 row-start-2 flex justify-center text-muted-foreground h-6">
							<span className="text-3xl font-light leading-none text-indigo-400">
								↕
							</span>
						</div>

						{/* ROW 3: Dependencies */}
						<div className="col-start-3 row-start-3">
							<ArchBox label="IdP" name="Auth0" tech="OpenID Connect" />
						</div>

						<div className="col-start-5 row-start-3">
							<ArchBox label="Database" name="MySQL 8.0" tech="Flyway (33)" />
						</div>
					</div>
				</div>
			</Slide>

			{/* Slide 4: Design Decisions */}
			<Slide index={3} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Design Decisions
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					設計の
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						根拠
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					なぜこの技術選定・アーキテクチャを採用したのか
				</p>
				<div className="w-full max-w-6xl mx-auto overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-indigo-400 whitespace-nowrap">
									設計判断
								</th>
								<th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-indigo-400">
									理由
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							<tr>
								<td className="py-5 px-6 font-semibold whitespace-nowrap text-foreground">
									BFF パターン
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									<strong className="text-indigo-400 font-medium">
										Access Token をブラウザに保持させず
									</strong>
									、HttpOnly Cookie + Session
									でセキュアに管理。SPAの認証におけるベストプラクティスに準拠。
								</td>
							</tr>
							<tr>
								<td className="py-5 px-6 font-semibold whitespace-nowrap text-foreground">
									Nginx (ローカル開発)
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									<strong className="text-indigo-400 font-medium">
										Docker内での名前解決（BFFリダイレクトURL問題）をクリア
									</strong>
									するため、ローカルではリバースプロキシとして採用。本番（Railway）では不要な柔軟な構成。
								</td>
							</tr>
							<tr>
								<td className="py-5 px-6 font-semibold flex items-center gap-2 whitespace-nowrap text-foreground">
									TanStack Query
									<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
										Server State
									</span>
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									サーバー状態をキャッシュし、
									<strong className="text-indigo-400 font-medium">
										楽観的更新（Optimistic Update）でUXを向上
									</strong>
									。Zustand は純粋なクライアント状態のみに限定し責務を分離。
								</td>
							</tr>
							<tr>
								<td className="py-5 px-6 font-semibold whitespace-nowrap text-foreground">
									Spring AI
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									Spring エコシステム内でLLMを統合。
									<strong className="text-indigo-400 font-medium">
										Function Calling でタスクCRUDを直接実行
									</strong>
									し、プロンプトの構造化と会話メモリ管理を標準APIで実現。
								</td>
							</tr>
							<tr>
								<td className="py-5 px-6 font-semibold whitespace-nowrap text-foreground">
									Flyway
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									<strong className="text-indigo-400 font-medium">
										継続的な機能追加にも安全に対応できるアジャイルなDB運用
									</strong>
									。チーム開発時にも再現性のあるDB構築を保証。
								</td>
							</tr>
							<tr>
								<td className="py-5 px-6 font-semibold whitespace-nowrap text-foreground">
									Docker Compose
								</td>
								<td className="py-5 px-6 text-muted-foreground leading-relaxed">
									<strong className="text-indigo-400 font-medium">
										MySQL・Nginx・2つのSpring
										Boot・Reactの5サービスをワンコマンドで起動
									</strong>
									。開発環境のセットアップコストを最小化。
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</Slide>

			{/* Slide 5: Tech Stack */}
			<Slide index={4} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Tech Stack
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					使用
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						技術
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					フロントエンド・バックエンド・インフラの全レイヤーを設計・実装
				</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
					<Card icon="🎨" title="Frontend">
						<div className="flex flex-wrap gap-2 mt-4">
							{[
								"React 19",
								"TypeScript",
								"Vite 7",
								"TailwindCSS 4",
								"TanStack Query",
								"Zustand",
								"React Router 7",
								"shadcn/ui",
								"dnd-kit",
								"Recharts",
							].map((t) => (
								<span
									key={t}
									className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
								>
									{t}
								</span>
							))}
						</div>
					</Card>
					<Card icon="⚙️" title="Backend">
						<div className="flex flex-wrap gap-2 mt-4">
							{[
								"Spring Boot 3.5",
								"Spring Security",
								"Spring AI 1.1",
								"OAuth2",
								"MySQL 8.0",
								"Flyway",
								"Lombok",
								"JPA",
							].map((t) => (
								<span
									key={t}
									className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
								>
									{t}
								</span>
							))}
						</div>
					</Card>
					<Card icon="🏗️" title="Infrastructure">
						<div className="flex flex-wrap gap-2 mt-4">
							{[
								"Docker",
								"Docker Compose",
								"Nginx",
								"Railway",
								"Auth0",
								"GitHub Actions",
								"Biome",
							].map((t) => (
								<span
									key={t}
									className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20"
								>
									{t}
								</span>
							))}
						</div>
					</Card>
				</div>
			</Slide>

			{/* Slide 6: Challenges */}
			<Slide index={5} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Challenges & Learnings
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					技術的
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						チャレンジ
					</span>
				</h2>
				<ul className="flex flex-col gap-2 w-full max-w-6xl mx-auto">
					<RationaleItem icon="🔗" title="BFF + OAuth2 の認証フロー構築">
						ローカル開発時のDocker環境特有の名前解決問題に対し、Nginxリバースプロキシを導入。CORS、CSRF設定、Auth0との整合など、
						<strong className="text-indigo-400 font-medium">
							複数レイヤーにまたがる認証フローの設計・デバッグを経験
						</strong>
						。
					</RationaleItem>
					<RationaleItem icon="🤖" title="Spring AI による構造化チャット">
						LLMのレスポンスを構造化JSONにパースし、
						<strong className="text-indigo-400 font-medium">
							Function Calling でタスクCRUDを直接実行
						</strong>
						する仕組みを実装。ChatMemory
						を用いた会話コンテキストの永続化も実現。
					</RationaleItem>
					<RationaleItem icon="📈" title="サーバー状態管理の設計転換">
						当初 Zustand で一元管理していたサーバー状態を TanStack Query
						に段階的に移行。
						<strong className="text-indigo-400 font-medium">
							楽観的更新とキャッシュ無効化によりUX改善とコードの責務分離を両立
						</strong>
						。
					</RationaleItem>
					<RationaleItem icon="🗃️" title="アジャイルなスキーマ進化">
						アジャイルに機能追加を重ねながら Flyway
						で破壊的変更なくDBスキーマを成長。
						<strong className="text-indigo-400 font-medium">
							継続的なデリバリーを支えるDB設計を実現
						</strong>
						。
					</RationaleItem>
				</ul>
			</Slide>

			{/* Slide 7: Future Challenges (Application) */}
			<Slide index={6} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Future Perspectives 1
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					アプリケーションの
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						今後の課題
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					プロダクトとしてさらに価値を高めるための強化ポイント
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
					<Card icon="📱" title="ネイティブアプリ & 複数デバイス連携">
						<strong className="text-indigo-400 font-medium">
							アプリやWebサイトへのアクセス制限機能を実装
						</strong>
						し、複数デバイス間でのリアルタイムな集中状態同期を実現。
						<strong className="text-indigo-500 font-medium">
							OSの壁を超えて「今、何に集中すべきか」を一貫して提示・管理
						</strong>
						する。
					</Card>
					<Card icon="🎵" title="外部サービス（Spotify等）との統合">
						Spotify等のWeb APIを活用し、
						<strong className="text-indigo-400 font-medium">
							集中開始に合わせたプレイリスト再生や音量制限を自動化
						</strong>
						。OSに依存しないサービス連携により、作業への没入を多角的に支援する。
					</Card>
					<Card icon="🗓️" title="外部カレンダー連携">
						Google
						CalendarやOutlookとの双方向同期。既存の予定管理ツールと統合し、
						<strong className="text-indigo-400 font-medium">
							ユーザーの全スケジュールをAIが把握・調整可能
						</strong>
						にする。
					</Card>
					<Card icon="🧠" title="AI メンタリングのパーソナライズ">
						作業ログを元にユーザーの集中パターンを分析。
						<strong className="text-indigo-400 font-medium">
							リスケジュール提案や、パーソナライズされた生産性アドバイス
						</strong>
						を実装する。
					</Card>
				</div>
			</Slide>

			{/* Slide 8: Future Challenges (Personal) */}
			<Slide index={7} current={current}>
				<div className="text-xs md:text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3 text-center">
					Future Perspectives 2
				</div>
				<h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
					作成者自身の
					<span className="bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
						今後の課題
					</span>
				</h2>
				<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center mb-10 leading-relaxed">
					エンジニアとしてさらに成長するためのフォーカスエリア
				</p>
				<ul className="flex flex-col gap-2 w-full max-w-6xl mx-auto">
					<RationaleItem icon="🧪" title="テストカバレッジの拡充と自動化">
						<strong className="text-indigo-400 font-medium">
							JUnit/Mockitoによるバックエンドの単体テストや、Jest/Cypressを用いたフロントエンドのE2Eテストを完備
						</strong>
						し、CIパイプラインの品質ゲートを強化する。
					</RationaleItem>
					<RationaleItem icon="🏗️" title="クラウドプラットフォーム（AWS）の習得">
						Railway環境から一歩踏み出し、
						<strong className="text-indigo-400 font-medium">
							AWSを用いたセキュアでスケーラブルなインフラ構築
						</strong>
						を実践し、主要クラウド上でのシステム運用能力を高める。
					</RationaleItem>
					<RationaleItem icon="📖" title="公式ドキュメントの網羅的な学習">
						AIによる機能生成→該当する公式ドキュメントを読んで確認する、から
						<strong className="text-indigo-400 font-medium">
							公式ドキュメントを深く読み込み、技術スタックへの根本的な理解度を向上させる
						</strong>
						。
					</RationaleItem>
					<RationaleItem icon="🐕" title="Apidog による API デザイン & テスト">
						Apidog を導入し、API
						設計、ドキュメント生成、モック作成、自動テストを一貫して管理。
						<strong className="text-indigo-400 font-medium">
							設計段階から品質を作り込む API ファーストの開発手法
						</strong>
						を習得する。
					</RationaleItem>
					<RationaleItem icon="⌨️" title="技術ブログの開設とアウトプット">
						開発を通じた知見を言語化。
						<strong className="text-indigo-400 font-medium">
							アウトプットを通じて知識の定着を図り、エンジニアコミュニティへ貢献
						</strong>
						したい。
					</RationaleItem>
				</ul>
			</Slide>

			{/* Slide 9: Thank You */}
			<Slide index={8} current={current} className="text-center">
				<h1 className="text-6xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent mb-6">
					Thank You
				</h1>
				<p className="text-2xl md:text-3xl text-muted-foreground font-light mb-4">
					お時間をいただき、ありがとうございました！！
				</p>
				<Link to="/home">
					<Button
						size="lg"
						className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
					>
						<Play className="mr-2 h-5 w-5 fill-current" />
						Todoアプリを使ってみる
					</Button>
				</Link>
			</Slide>
		</div>
	);
}

/* ===== Sub-components ===== */

function Slide({
	index,
	current,
	className = "",
	children,
}: {
	index: number;
	current: number;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`absolute inset-0 flex flex-col justify-center items-center px-4 md:px-10 transition-all duration-500 ease-out bg-background
				${index === current ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"} 
				${className}`}
		>
			{children}
		</div>
	);
}

function Card({
	icon,
	title,
	children,
}: {
	icon: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 group">
			<span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left">
				{icon}
			</span>
			<div className="text-lg font-semibold mb-2 text-foreground group-hover:text-indigo-400 transition-colors">
				{title}
			</div>
			<div className="text-sm text-muted-foreground leading-relaxed">
				{children}
			</div>
		</div>
	);
}

function ArchBox({
	label,
	name,
	tech,
	accent,
}: {
	label: string;
	name: string;
	tech: string;
	accent?: boolean;
}) {
	return (
		<div
			className={`bg-card border rounded-2xl p-6 md:p-8 text-center min-w-[220px] md:min-w-[260px] transition-all duration-300 ${accent ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-border hover:border-indigo-500/40"}`}
		>
			<div className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-2">
				{label}
			</div>
			<div className="text-xl md:text-2xl font-bold mb-2 text-foreground leading-tight">
				{name}
			</div>
			<div className="text-xs md:text-sm text-muted-foreground font-mono">
				{tech}
			</div>
		</div>
	);
}

function RationaleItem({
	icon,
	title,
	children,
}: {
	icon: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-5 py-5 border-b border-border/50 last:border-0 items-start hover:bg-muted/30 px-4 rounded-xl transition-colors">
			<span className="text-2xl mt-0.5">{icon}</span>
			<div>
				<div className="font-semibold text-base mb-1.5 text-foreground">
					{title}
				</div>
				<div className="text-sm text-muted-foreground leading-relaxed">
					{children}
				</div>
			</div>
		</li>
	);
}
