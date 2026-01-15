import { Link } from "@inertiajs/react";
function Pagination({ links }) {
    return (
        <>
            <div className="join">
                {links.map((e) => {
                    let disabled = e.url == null;
                    return (
                        <Link
                            className={`join-item btn ${
                                e.active == true ? " btn-primary" : ""
                            }`}
                            disabled={disabled}
                            href={`${e?.url}`}
                            dangerouslySetInnerHTML={{ __html: e?.label }}
                        ></Link>
                    );
                })}
            </div>
        </>
    );
}

export default Pagination;
