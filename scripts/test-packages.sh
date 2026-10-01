#!/bin/sh

set -u

action="$1"
overall_status=0
script_dir="$(CDPATH='' cd -- "$(dirname "$0")" && pwd)"

detect_test_package_manager() {
	pkg="$1"
	pkg_dir="$(dirname "$pkg")"
	pm_field="$(sed -n 's/.*"packageManager"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$pkg" | head -n 1)"

	case "$pm_field" in
	pnpm@*) echo "pnpm" ;;
	yarn@*) echo "yarn" ;;
	npm@*) echo "npm" ;;
	*)
		if [ -f "$pkg_dir/pnpm-lock.yaml" ]; then
			echo "pnpm"
		elif [ -f "$pkg_dir/yarn.lock" ]; then
			echo "yarn"
		else
			echo "npm"
		fi
		;;
	esac
}

run_install_for_pm() {
	pkg_dir="$1"
	pm="$2"

	case "$pm" in
	npm) (cd "$pkg_dir" && npm install) ;;
	pnpm) (cd "$pkg_dir" && corepack pnpm install) ;;
	yarn) (cd "$pkg_dir" && corepack yarn install) ;;
	esac
}

run_with_terminal_input() {
	if [ -r /dev/tty ]; then
		"$@" </dev/tty
	else
		"$@"
	fi
}

has_yarn_resolutions() {
	pkg_file="$1/package.json"
	grep -q '"resolutions"[[:space:]]*:' "$pkg_file"
}

yarn_has_direct_dependency_updates() {
	pkg_dir="$1"
	updates_json="$(
		cd "$pkg_dir" && npm exec --yes npm-check-updates@latest -- --packageFile package.json --jsonUpgraded --loglevel silent 2>/dev/null
	)"

	case "$(printf '%s' "$updates_json" | tr -d '[:space:]')" in
	'' | '{}') return 1 ;;
	*) return 0 ;;
	esac
}

run_interactive_update_for_pm() {
	pkg_dir="$1"
	pm="$2"

	case "$pm" in
	npm)
		if ! (cd "$pkg_dir" && run_with_terminal_input npm exec --yes npm-check-updates@latest -- -i); then
			return 1
		fi
		run_install_for_pm "$pkg_dir" "$pm"
		;;
	pnpm) (cd "$pkg_dir" && run_with_terminal_input corepack pnpm update --interactive --latest) ;;
	yarn)
		resolutions_updated=0

		if has_yarn_resolutions "$pkg_dir"; then
			before_checksum="$(cksum "$pkg_dir/package.json")"

			if ! (cd "$pkg_dir" && run_with_terminal_input node "$script_dir/update-yarn-resolutions.js" package.json); then
				return 1
			fi

			after_checksum="$(cksum "$pkg_dir/package.json")"
			if [ "$before_checksum" != "$after_checksum" ]; then
				resolutions_updated=1
				run_install_for_pm "$pkg_dir" "$pm"
			fi
		fi

		if yarn_has_direct_dependency_updates "$pkg_dir"; then
			(cd "$pkg_dir" && run_with_terminal_input corepack yarn upgrade-interactive --latest)
		elif [ "$resolutions_updated" -eq 0 ]; then
			echo "All of your dependencies are already up to date"
		fi
		;;
	esac
}

run_audit_fix_for_pm() {
	pkg_dir="$1"
	pm="$2"

	case "$pm" in
	npm)
		run_install_for_pm "$pkg_dir" "$pm"
		echo "npm audit fix in $pkg_dir"
		(cd "$pkg_dir" && npm audit fix)
		;;
	pnpm)
		run_install_for_pm "$pkg_dir" "$pm"
		echo "pnpm audit --fix=update in $pkg_dir"
		(cd "$pkg_dir" && corepack pnpm audit --fix=update)
		;;
	yarn)
		run_install_for_pm "$pkg_dir" "$pm"
		echo "yarn audit in $pkg_dir"
		(cd "$pkg_dir" && corepack yarn audit)
		;;
	esac
}

run_for_each_test_package() {
	packages="$(find tests -type f -name package.json -not -path '*/node_modules/*' -print | sort)"

	for pkg in $packages; do
		pkg_dir="$(dirname "$pkg")"
		pm="$(detect_test_package_manager "$pkg")"

		echo "---"
		echo "Detected $pm in $pkg_dir"

		case "$action" in
		install)
			run_install_for_pm "$pkg_dir" "$pm"
			;;
		update-interactive)
			if ! run_interactive_update_for_pm "$pkg_dir" "$pm"; then
				overall_status=1
			fi
			;;
		audit-fix)
			if ! run_audit_fix_for_pm "$pkg_dir" "$pm"; then
				overall_status=1
			fi
			;;
		*)
			echo "Unsupported action: $action" >&2
			exit 2
			;;
		esac
	done
}

case "$action" in
install)
	echo "Installing dependencies for package.json files under tests/ ..."
	;;
update-interactive)
	echo "Running interactive dependency updates for package.json files under tests/ ..."
	;;
audit-fix)
	echo "Running dependency audit/fix for package.json files under tests/ ..."
	;;
*)
	echo "Unsupported action: $action" >&2
	exit 2
	;;
esac

run_for_each_test_package

exit "$overall_status"
